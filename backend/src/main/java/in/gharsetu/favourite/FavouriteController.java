package in.gharsetu.favourite;

import in.gharsetu.auth.CurrentUser;
import in.gharsetu.common.ApiException;
import in.gharsetu.common.PageResponse;
import in.gharsetu.property.Property;
import in.gharsetu.property.PropertyDtos.PropertyCard;
import in.gharsetu.property.PropertyRepository;
import in.gharsetu.property.PropertyService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class FavouriteController {
    private final FavouriteRepository favourites;
    private final PropertyRepository properties;
    private final PropertyService propertyService;

    @PutMapping("/properties/{id}/favourite")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void add(@PathVariable Long id) {
        Long userId = CurrentUser.require().id();
        Property p = properties.findById(id).filter(Property::isPubliclyVisible)
                .orElseThrow(() -> ApiException.notFound("Property"));
        if (!favourites.existsByUserIdAndPropertyId(userId, p.getId())) {
            favourites.save(new Favourite(userId, p.getId()));
        }
    }

    @DeleteMapping("/properties/{id}/favourite")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void remove(@PathVariable Long id) {
        favourites.deleteById(new Favourite.Key(CurrentUser.require().id(), id));
    }

    /** Saved properties, including ones since sold or paused, so the buyer sees what changed. */
    @GetMapping("/me/favourites")
    @Transactional(readOnly = true)
    public PageResponse<PropertyCard> list(@RequestParam(defaultValue = "0") int page) {
        var favPage = favourites.findByUserIdOrderByCreatedAtDesc(CurrentUser.require().id(), PageRequest.of(page, 24));
        List<Long> ids = favPage.getContent().stream().map(Favourite::getPropertyId).toList();
        Map<Long, Property> byId = properties.findAllById(ids).stream()
                .collect(Collectors.toMap(Property::getId, Function.identity()));
        Map<Long, String> covers = propertyService.coverUrls(ids);
        List<PropertyCard> cards = ids.stream().map(byId::get)
                .filter(p -> p != null && p.getStatus() != in.gharsetu.property.PropertyEnums.ListingStatus.DELETED)
                .map(p -> propertyService.card(p, covers.get(p.getId()))).toList();
        return PageResponse.of(new PageImpl<>(cards, favPage.getPageable(), favPage.getTotalElements()), Function.identity());
    }
}

package in.gharsetu.property;

import in.gharsetu.auth.CurrentUser;
import in.gharsetu.common.ApiException;
import in.gharsetu.common.PageResponse;
import in.gharsetu.property.PropertyDtos.*;
import in.gharsetu.property.PropertyEnums.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class PropertyController {
    private final PropertyService service;

    @GetMapping("/properties")
    public PageResponse<PropertyCard> search(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String locality,
            @RequestParam(required = false) Category category,
            @RequestParam(required = false) PropertyType type,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Integer minBedrooms,
            @RequestParam(required = false) BigDecimal minArea,
            @RequestParam(required = false) BigDecimal maxArea,
            @RequestParam(required = false) Furnishing furnishing,
            @RequestParam(required = false) Possession possession,
            @RequestParam(required = false) Boolean featured,
            @RequestParam(required = false) Boolean verified,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) SortOrder sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        if (q != null && q.length() > 100) {
            throw ApiException.badRequest("Search text is too long");
        }
        var criteria = new SearchCriteria(city, locality, category, type, minPrice, maxPrice, minBedrooms,
                minArea, maxArea, furnishing, possession, featured, verified, q, sort);
        return service.search(criteria, page, size);
    }

    @GetMapping("/properties/featured")
    public List<PropertyCard> featured(@RequestParam(defaultValue = "gwalior") String city,
                                       @RequestParam(defaultValue = "6") int size) {
        var c = new SearchCriteria(city, null, null, null, null, null, null, null, null, null, null,
                true, null, null, SortOrder.newest);
        return service.search(c, 0, Math.min(size, 12)).items();
    }

    @GetMapping("/properties/recent")
    public List<PropertyCard> recent(@RequestParam(defaultValue = "gwalior") String city,
                                     @RequestParam(defaultValue = "8") int size) {
        var c = new SearchCriteria(city, null, null, null, null, null, null, null, null, null, null,
                null, null, null, SortOrder.newest);
        return service.search(c, 0, Math.min(size, 12)).items();
    }

    @GetMapping("/properties/{id}")
    public PropertyDetail get(@PathVariable Long id) {
        return service.get(id, CurrentUser.optional());
    }

    @GetMapping("/amenities")
    public List<PropertyService.AmenityView> amenities() {
        return service.amenities();
    }

    @PostMapping("/properties")
    @ResponseStatus(HttpStatus.CREATED)
    public PropertyDetail create(@Valid @RequestBody PropertyRequest req) {
        return service.create(CurrentUser.require(), req);
    }

    @PutMapping("/properties/{id}")
    public PropertyDetail update(@PathVariable Long id, @Valid @RequestBody PropertyRequest req) {
        return service.update(CurrentUser.require(), id, req);
    }

    @DeleteMapping("/properties/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.changeStatus(CurrentUser.require(), id, ListingStatus.DELETED);
    }

    @PostMapping("/properties/{id}/pause")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void pause(@PathVariable Long id) {
        service.changeStatus(CurrentUser.require(), id, ListingStatus.PAUSED);
    }

    @PostMapping("/properties/{id}/activate")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void activate(@PathVariable Long id) {
        service.changeStatus(CurrentUser.require(), id, ListingStatus.ACTIVE);
    }

    @PostMapping("/properties/{id}/mark-sold")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markSold(@PathVariable Long id) {
        service.changeStatus(CurrentUser.require(), id, ListingStatus.SOLD);
    }

    @PostMapping(value = "/properties/{id}/images", consumes = "multipart/form-data")
    @ResponseStatus(HttpStatus.CREATED)
    public ImageView upload(@PathVariable Long id, @RequestParam("file") MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw ApiException.badRequest("File is empty");
        }
        return service.addImage(CurrentUser.require(), id, file.getBytes());
    }

    @DeleteMapping("/properties/{id}/images/{imageId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteImage(@PathVariable Long id, @PathVariable Long imageId) {
        service.deleteImage(CurrentUser.require(), id, imageId);
    }

    @GetMapping("/me/properties")
    public PageResponse<MyListing> mine(@RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "20") int size) {
        return service.myListings(CurrentUser.require(), page, size);
    }
}

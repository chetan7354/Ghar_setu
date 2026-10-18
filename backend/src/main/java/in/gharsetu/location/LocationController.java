package in.gharsetu.location;

import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/cities")
@RequiredArgsConstructor
public class LocationController {
    private final CityRepository cities;
    private final LocalityRepository localities;

    public record CityView(Long id, String name, String state, String slug) {}

    public record LocalityView(Long id, String name, String slug, String pinCode, boolean popular) {}

    @GetMapping
    @Transactional(readOnly = true)
    public List<CityView> list() {
        return cities.findByActiveTrueOrderByName().stream()
                .map(c -> new CityView(c.getId(), c.getName(), c.getState(), c.getSlug())).toList();
    }

    @GetMapping("/{slug}/localities")
    @Transactional(readOnly = true)
    public List<LocalityView> localities(@PathVariable String slug) {
        return localities.findByCitySlugOrderByPopularDescNameAsc(slug).stream()
                .map(l -> new LocalityView(l.getId(), l.getName(), l.getSlug(), l.getPinCode(), l.isPopular()))
                .toList();
    }
}

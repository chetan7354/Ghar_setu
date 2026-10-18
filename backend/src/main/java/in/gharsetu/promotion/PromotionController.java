package in.gharsetu.promotion;

import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

/** Public price list for the pricing page. Buying online is not available until a payment gateway is integrated. */
@RestController
@RequestMapping("/api/v1/promotion-packages")
@RequiredArgsConstructor
public class PromotionController {
    private final PromotionPackageRepository packages;

    public record PackageView(Long id, String code, String name, int durationDays, BigDecimal price, boolean active) {
        public static PackageView of(PromotionPackage p) {
            return new PackageView(p.getId(), p.getCode(), p.getName(), p.getDurationDays(), p.getPrice(), p.isActive());
        }
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<PackageView> list() {
        return packages.findByActiveTrueOrderByDurationDaysAsc().stream().map(PackageView::of).toList();
    }
}

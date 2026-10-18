package in.gharsetu.promotion;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PromotionPackageRepository extends JpaRepository<PromotionPackage, Long> {
    List<PromotionPackage> findByActiveTrueOrderByDurationDaysAsc();

    List<PromotionPackage> findAllByOrderByDurationDaysAsc();
}

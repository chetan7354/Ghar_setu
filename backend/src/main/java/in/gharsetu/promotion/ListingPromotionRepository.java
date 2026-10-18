package in.gharsetu.promotion;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ListingPromotionRepository extends JpaRepository<ListingPromotion, Long> {
    long countBySource(ListingPromotion.Source source);
}

package in.gharsetu.property;

import in.gharsetu.property.PropertyEnums.ListingStatus;
import in.gharsetu.property.PropertyEnums.ModerationStatus;
import in.gharsetu.property.PropertyEnums.PropertyType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;

import java.math.BigDecimal;
import java.util.List;

public interface PropertyRepository extends JpaRepository<Property, Long>, JpaSpecificationExecutor<Property> {

    @EntityGraph(attributePaths = {"locality", "city"})
    Page<Property> findByOwnerIdAndStatusNotOrderByCreatedAtDesc(Long ownerId, ListingStatus status, Pageable pageable);

    @EntityGraph(attributePaths = {"locality", "city", "owner"})
    Page<Property> findByModerationStatusAndStatusNotOrderByCreatedAtAsc(ModerationStatus m, ListingStatus s, Pageable p);

    long countByStatusAndModerationStatus(ListingStatus status, ModerationStatus moderation);

    long countByModerationStatusAndStatusNot(ModerationStatus moderation, ListingStatus status);

    @Query("select p.id from Property p where p.locality.id = :localityId and p.propertyType = :type "
            + "and p.status <> in.gharsetu.property.PropertyEnums.ListingStatus.DELETED "
            + "and p.price between :minPrice and :maxPrice "
            + "and (:minArea is null or p.areaSqft between :minArea and :maxArea) "
            + "and (p.owner.id = :ownerId or p.owner.phone = :ownerPhone) and p.id <> :excludeId")
    List<Long> findPossibleDuplicates(Long localityId, PropertyType type, BigDecimal minPrice, BigDecimal maxPrice,
                                      BigDecimal minArea, BigDecimal maxArea, Long ownerId, String ownerPhone,
                                      Long excludeId, Pageable pageable);

    @Modifying
    @Query("update Property p set p.viewCount = p.viewCount + 1 where p.id = :id")
    void incrementViews(Long id);
}

package in.gharsetu.visit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface SiteVisitRepository extends JpaRepository<SiteVisitRequest, Long> {
    boolean existsByBuyerIdAndPropertyIdAndStatusIn(Long buyerId, Long propertyId,
                                                   Collection<SiteVisitRequest.Status> statuses);

    @EntityGraph(attributePaths = {"property", "buyer"})
    Page<SiteVisitRequest> findByOwnerIdOrderByCreatedAtDesc(Long ownerId, Pageable pageable);

    @EntityGraph(attributePaths = {"property", "owner"})
    Page<SiteVisitRequest> findByBuyerIdOrderByCreatedAtDesc(Long buyerId, Pageable pageable);

    long countByStatus(SiteVisitRequest.Status status);

    @Query("select v.property.id, count(v) from SiteVisitRequest v where v.property.id in :ids group by v.property.id")
    List<Object[]> countByPropertyIds(Collection<Long> ids);
}

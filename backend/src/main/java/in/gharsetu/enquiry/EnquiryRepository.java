package in.gharsetu.enquiry;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

public interface EnquiryRepository extends JpaRepository<Enquiry, Long> {
    boolean existsByBuyerIdAndPropertyId(Long buyerId, Long propertyId);

    long countByBuyerIdAndPropertyIdAndCreatedAtAfter(Long buyerId, Long propertyId, Instant after);

    @EntityGraph(attributePaths = {"property", "buyer"})
    Page<Enquiry> findByOwnerIdOrderByCreatedAtDesc(Long ownerId, Pageable pageable);

    @EntityGraph(attributePaths = {"property", "owner"})
    Page<Enquiry> findByBuyerIdOrderByCreatedAtDesc(Long buyerId, Pageable pageable);

    @Query("select e.property.id, count(e) from Enquiry e where e.property.id in :ids group by e.property.id")
    List<Object[]> countByPropertyIds(Collection<Long> ids);
}

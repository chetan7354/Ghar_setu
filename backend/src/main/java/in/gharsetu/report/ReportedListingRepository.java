package in.gharsetu.report;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportedListingRepository extends JpaRepository<ReportedListing, Long> {
    @EntityGraph(attributePaths = "property")
    Page<ReportedListing> findByStatusOrderByCreatedAtAsc(ReportedListing.Status status, Pageable pageable);

    long countByStatus(ReportedListing.Status status);
}

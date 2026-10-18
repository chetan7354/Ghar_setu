package in.gharsetu.audit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    Page<AuditLog> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<AuditLog> findByEntityTypeAndEntityIdOrderByCreatedAtAsc(String entityType, Long entityId);
}

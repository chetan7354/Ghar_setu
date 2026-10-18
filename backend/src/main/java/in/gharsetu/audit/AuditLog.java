package in.gharsetu.audit;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long actorId;
    private String action;
    private String entityType;
    private Long entityId;
    private String details;
    private String ip;
    private Instant createdAt;
}

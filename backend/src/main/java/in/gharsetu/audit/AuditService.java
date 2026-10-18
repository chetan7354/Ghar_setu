package in.gharsetu.audit;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Instant;

/** Append-only audit trail. Joins the caller's transaction so a rolled-back action leaves no audit row. */
@Service
@RequiredArgsConstructor
public class AuditService {
    private final AuditLogRepository repo;

    @Transactional(propagation = Propagation.MANDATORY)
    public void log(Long actorId, String action, String entityType, Long entityId, String details) {
        AuditLog a = new AuditLog();
        a.setActorId(actorId);
        a.setAction(action);
        a.setEntityType(entityType);
        a.setEntityId(entityId);
        a.setDetails(details == null ? null : details.substring(0, Math.min(details.length(), 2000)));
        a.setIp(currentIp());
        a.setCreatedAt(Instant.now());
        repo.save(a);
    }

    private static String currentIp() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attrs) {
            return attrs.getRequest().getRemoteAddr();
        }
        return null;
    }
}

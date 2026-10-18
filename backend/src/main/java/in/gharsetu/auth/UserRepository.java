package in.gharsetu.auth;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByPhone(String phone);

    @Query("select u from User u where (:q is null or lower(u.fullName) like lower(concat('%', :q, '%')) "
            + "or lower(u.email) like lower(concat('%', :q, '%')) or u.phone like concat('%', :q, '%'))")
    Page<User> search(String q, Pageable pageable);
}

package in.gharsetu.location;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LocalityRepository extends JpaRepository<Locality, Long> {
    List<Locality> findByCitySlugOrderByPopularDescNameAsc(String citySlug);
}

package in.gharsetu.location;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CityRepository extends JpaRepository<City, Long> {
    List<City> findByActiveTrueOrderByName();

    Optional<City> findBySlug(String slug);
}

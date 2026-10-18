package in.gharsetu.favourite;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FavouriteRepository extends JpaRepository<Favourite, Favourite.Key> {
    boolean existsByUserIdAndPropertyId(Long userId, Long propertyId);

    Page<Favourite> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
}

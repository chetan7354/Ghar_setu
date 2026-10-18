package in.gharsetu.property;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.List;

public interface PropertyImageRepository extends JpaRepository<PropertyImage, Long> {
    /** First image of each property, for search cards, in one query. */
    @Query("select i from PropertyImage i where i.property.id in :ids and i.sortOrder = "
            + "(select min(j.sortOrder) from PropertyImage j where j.property.id = i.property.id) order by i.id")
    List<PropertyImage> findCoverImages(Collection<Long> ids);

    long countByPropertyId(Long propertyId);
}

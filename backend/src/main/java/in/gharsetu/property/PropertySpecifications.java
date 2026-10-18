package in.gharsetu.property;

import in.gharsetu.property.PropertyDtos.SearchCriteria;
import in.gharsetu.property.PropertyDtos.SortOrder;
import in.gharsetu.property.PropertyEnums.ListingStatus;
import in.gharsetu.property.PropertyEnums.ModerationStatus;
import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Order;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/** Builds the SQL WHERE / ORDER BY for public property search. All filtering happens in MySQL. */
public final class PropertySpecifications {
    private PropertySpecifications() {}

    public static Specification<Property> publicSearch(SearchCriteria c, Instant now) {
        return (root, query, cb) -> {
            List<Predicate> p = new ArrayList<>();
            p.add(cb.equal(root.get("status"), ListingStatus.ACTIVE));
            p.add(cb.equal(root.get("moderationStatus"), ModerationStatus.APPROVED));
            if (notBlank(c.city())) {
                p.add(cb.equal(root.get("city").get("slug"), c.city()));
            }
            if (notBlank(c.locality())) {
                p.add(cb.equal(root.get("locality").get("slug"), c.locality()));
            }
            if (c.category() != null) {
                p.add(cb.equal(root.get("category"), c.category()));
            }
            if (c.type() != null) {
                p.add(cb.equal(root.get("propertyType"), c.type()));
            }
            if (c.minPrice() != null) {
                p.add(cb.greaterThanOrEqualTo(root.get("price"), c.minPrice()));
            }
            if (c.maxPrice() != null) {
                p.add(cb.lessThanOrEqualTo(root.get("price"), c.maxPrice()));
            }
            if (c.minBedrooms() != null) {
                p.add(cb.greaterThanOrEqualTo(root.get("bedrooms"), c.minBedrooms()));
            }
            if (c.minArea() != null) {
                p.add(cb.greaterThanOrEqualTo(root.get("areaSqft"), c.minArea()));
            }
            if (c.maxArea() != null) {
                p.add(cb.lessThanOrEqualTo(root.get("areaSqft"), c.maxArea()));
            }
            if (c.furnishing() != null) {
                p.add(cb.equal(root.get("furnishing"), c.furnishing()));
            }
            if (c.possession() != null) {
                p.add(cb.equal(root.get("possession"), c.possession()));
            }
            if (Boolean.TRUE.equals(c.featured())) {
                p.add(cb.greaterThan(root.get("featuredUntil"), now));
            }
            if (Boolean.TRUE.equals(c.verified())) {
                p.add(cb.isTrue(root.get("contactVerified")));
            }
            if (notBlank(c.q())) {
                String like = "%" + c.q().trim().toLowerCase().replace("%", "").replace("_", "") + "%";
                p.add(cb.or(cb.like(cb.lower(root.get("title")), like),
                        cb.like(cb.lower(root.get("locality").get("name")), like)));
            }

            // Ordering only applies to the data query, not to Spring Data's count query.
            if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                List<Order> order = new ArrayList<>();
                SortOrder sort = c.sort() == null ? SortOrder.relevance : c.sort();
                switch (sort) {
                    case price_asc -> order.add(cb.asc(root.get("price")));
                    case price_desc -> order.add(cb.desc(root.get("price")));
                    case newest -> order.add(cb.desc(root.get("publishedAt")));
                    case relevance -> {
                        Expression<Integer> featuredFirst = cb.<Integer>selectCase()
                                .when(cb.greaterThan(root.get("featuredUntil"), now), 0).otherwise(1);
                        order.add(cb.asc(featuredFirst));
                        order.add(cb.desc(root.get("publishedAt")));
                    }
                }
                order.add(cb.desc(root.get("id")));
                query.orderBy(order);
            }
            return cb.and(p.toArray(Predicate[]::new));
        };
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }
}

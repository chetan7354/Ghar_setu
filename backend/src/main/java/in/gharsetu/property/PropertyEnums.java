package in.gharsetu.property;

import java.math.BigDecimal;

public final class PropertyEnums {
    private PropertyEnums() {}

    public enum Category { RESIDENTIAL, COMMERCIAL, LAND }

    public enum PropertyType {
        APARTMENT(Category.RESIDENTIAL, true),
        INDEPENDENT_HOUSE(Category.RESIDENTIAL, true),
        VILLA(Category.RESIDENTIAL, true),
        BUILDER_FLOOR(Category.RESIDENTIAL, true),
        PLOT(Category.LAND, false),
        AGRICULTURAL_LAND(Category.LAND, false),
        SHOP(Category.COMMERCIAL, false),
        OFFICE(Category.COMMERCIAL, false),
        WAREHOUSE(Category.COMMERCIAL, false),
        OTHER_COMMERCIAL(Category.COMMERCIAL, false);

        private final Category category;
        private final boolean hasRooms;

        PropertyType(Category category, boolean hasRooms) {
            this.category = category;
            this.hasRooms = hasRooms;
        }

        public Category category() {
            return category;
        }

        /** Bedrooms / bathrooms / furnishing only make sense for homes. */
        public boolean hasRooms() {
            return hasRooms;
        }

        public boolean isLand() {
            return category == Category.LAND;
        }
    }

    public enum ListingType { SALE, RENT }

    public enum AreaUnit {
        SQFT(new BigDecimal("1")), SQYD(new BigDecimal("9")), SQM(new BigDecimal("10.7639"));

        private final BigDecimal toSqft;

        AreaUnit(BigDecimal toSqft) {
            this.toSqft = toSqft;
        }

        public BigDecimal toSqft(BigDecimal value) {
            return value == null ? null : value.multiply(toSqft);
        }
    }

    public enum Furnishing { UNFURNISHED, SEMI_FURNISHED, FULLY_FURNISHED }

    public enum Possession { READY, UNDER_CONSTRUCTION }

    public enum ContactPreference { CALL, CHAT, BOTH }

    public enum ListingStatus { ACTIVE, PAUSED, SOLD, DELETED }

    public enum ModerationStatus { PENDING, APPROVED, REJECTED }
}

-- GharSetu core marketplace schema (MVP)

CREATE TABLE users (
    id                BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name         VARCHAR(120) NOT NULL,
    email             VARCHAR(190) NOT NULL,
    phone             VARCHAR(15)  NOT NULL,
    password_hash     VARCHAR(100) NOT NULL,
    email_verified_at DATETIME(6)  NULL,
    phone_verified_at DATETIME(6)  NULL,
    status            VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    created_at        DATETIME(6)  NOT NULL,
    updated_at        DATETIME(6)  NOT NULL,
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT uq_users_phone UNIQUE (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE roles (
    id   SMALLINT PRIMARY KEY,
    name VARCHAR(20) NOT NULL,
    CONSTRAINT uq_roles_name UNIQUE (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE user_roles (
    user_id BIGINT   NOT NULL,
    role_id SMALLINT NOT NULL,
    PRIMARY KEY (user_id, role_id),
    CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cities (
    id     BIGINT AUTO_INCREMENT PRIMARY KEY,
    name   VARCHAR(80) NOT NULL,
    state  VARCHAR(80) NOT NULL,
    slug   VARCHAR(80) NOT NULL,
    active BOOLEAN     NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_cities_slug UNIQUE (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE localities (
    id       BIGINT AUTO_INCREMENT PRIMARY KEY,
    city_id  BIGINT      NOT NULL,
    name     VARCHAR(100) NOT NULL,
    slug     VARCHAR(100) NOT NULL,
    pin_code VARCHAR(6)     NULL,
    popular  BOOLEAN     NOT NULL DEFAULT FALSE,
    CONSTRAINT uq_localities_city_slug UNIQUE (city_id, slug),
    CONSTRAINT fk_localities_city FOREIGN KEY (city_id) REFERENCES cities (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE amenities (
    id    BIGINT AUTO_INCREMENT PRIMARY KEY,
    code  VARCHAR(40) NOT NULL,
    label VARCHAR(80) NOT NULL,
    CONSTRAINT uq_amenities_code UNIQUE (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE properties (
    id                    BIGINT AUTO_INCREMENT PRIMARY KEY,
    owner_id              BIGINT        NOT NULL,
    title                 VARCHAR(150)  NOT NULL,
    category              VARCHAR(20)   NOT NULL,
    property_type         VARCHAR(30)   NOT NULL,
    listing_type          VARCHAR(10)   NOT NULL DEFAULT 'SALE',
    price                 DECIMAL(14,2) NOT NULL,
    price_negotiable      BOOLEAN       NOT NULL DEFAULT FALSE,
    built_up_area         DECIMAL(10,2) NULL,
    plot_area             DECIMAL(10,2) NULL,
    area_unit             VARCHAR(10)   NOT NULL DEFAULT 'SQFT',
    area_sqft             DECIMAL(12,2) NULL COMMENT 'normalised area used for range search',
    bedrooms              INT       NULL,
    bathrooms             INT       NULL,
    furnishing            VARCHAR(20)   NULL,
    property_age_years    INT       NULL,
    possession            VARCHAR(25)   NOT NULL DEFAULT 'READY',
    description           TEXT          NOT NULL,
    address_line          VARCHAR(255)  NOT NULL,
    locality_id           BIGINT        NOT NULL,
    city_id               BIGINT        NOT NULL,
    pin_code              VARCHAR(6)       NOT NULL,
    latitude              DECIMAL(9,6)  NULL,
    longitude             DECIMAL(9,6)  NULL,
    contact_preference    VARCHAR(10)   NOT NULL DEFAULT 'BOTH',
    show_phone            BOOLEAN       NOT NULL DEFAULT TRUE,
    status                VARCHAR(15)   NOT NULL DEFAULT 'ACTIVE',
    moderation_status     VARCHAR(15)   NOT NULL DEFAULT 'PENDING',
    moderation_note       VARCHAR(500)  NULL,
    possible_duplicate_of BIGINT        NULL,
    contact_verified      BOOLEAN       NOT NULL DEFAULT FALSE,
    ownership_reviewed_at DATETIME(6)   NULL,
    featured_until        DATETIME(6)   NULL,
    view_count            INT           NOT NULL DEFAULT 0,
    published_at          DATETIME(6)   NULL,
    created_at            DATETIME(6)   NOT NULL,
    updated_at            DATETIME(6)   NOT NULL,
    version               INT           NOT NULL DEFAULT 0,
    CONSTRAINT fk_properties_owner    FOREIGN KEY (owner_id)    REFERENCES users (id),
    CONSTRAINT fk_properties_locality FOREIGN KEY (locality_id) REFERENCES localities (id),
    CONSTRAINT fk_properties_city     FOREIGN KEY (city_id)     REFERENCES cities (id),
    CONSTRAINT chk_properties_price   CHECK (price > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX idx_prop_search    ON properties (city_id, status, moderation_status, price);
CREATE INDEX idx_prop_locality  ON properties (locality_id, status, moderation_status);
CREATE INDEX idx_prop_type      ON properties (property_type);
CREATE INDEX idx_prop_bedrooms  ON properties (bedrooms);
CREATE INDEX idx_prop_area      ON properties (area_sqft);
CREATE INDEX idx_prop_published ON properties (published_at);
CREATE INDEX idx_prop_featured  ON properties (featured_until);
CREATE INDEX idx_prop_owner     ON properties (owner_id, status);

CREATE TABLE property_images (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    property_id BIGINT       NOT NULL,
    storage_key VARCHAR(255) NOT NULL,
    url         VARCHAR(500) NOT NULL,
    sort_order  INT          NOT NULL DEFAULT 0,
    created_at  DATETIME(6)  NOT NULL,
    CONSTRAINT fk_images_property FOREIGN KEY (property_id) REFERENCES properties (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_images_property ON property_images (property_id, sort_order);

CREATE TABLE property_amenities (
    property_id BIGINT NOT NULL,
    amenity_id  BIGINT NOT NULL,
    PRIMARY KEY (property_id, amenity_id),
    CONSTRAINT fk_pa_property FOREIGN KEY (property_id) REFERENCES properties (id) ON DELETE CASCADE,
    CONSTRAINT fk_pa_amenity  FOREIGN KEY (amenity_id)  REFERENCES amenities (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE favourites (
    user_id     BIGINT      NOT NULL,
    property_id BIGINT      NOT NULL,
    created_at  DATETIME(6) NOT NULL,
    PRIMARY KEY (user_id, property_id),
    CONSTRAINT fk_fav_user     FOREIGN KEY (user_id)     REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_fav_property FOREIGN KEY (property_id) REFERENCES properties (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE enquiries (
    id                 BIGINT AUTO_INCREMENT PRIMARY KEY,
    property_id        BIGINT        NOT NULL,
    buyer_id           BIGINT        NOT NULL,
    owner_id           BIGINT        NOT NULL,
    message            VARCHAR(1000) NOT NULL,
    buyer_phone_shared BOOLEAN       NOT NULL DEFAULT TRUE,
    status             VARCHAR(15)   NOT NULL DEFAULT 'NEW',
    owner_reply        VARCHAR(1000) NULL,
    created_at         DATETIME(6)   NOT NULL,
    updated_at         DATETIME(6)   NOT NULL,
    CONSTRAINT fk_enq_property FOREIGN KEY (property_id) REFERENCES properties (id),
    CONSTRAINT fk_enq_buyer    FOREIGN KEY (buyer_id)    REFERENCES users (id),
    CONSTRAINT fk_enq_owner    FOREIGN KEY (owner_id)    REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_enq_owner    ON enquiries (owner_id, created_at);
CREATE INDEX idx_enq_buyer    ON enquiries (buyer_id, created_at);
CREATE INDEX idx_enq_property ON enquiries (property_id);

CREATE TABLE site_visit_requests (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    property_id  BIGINT       NOT NULL,
    buyer_id     BIGINT       NOT NULL,
    owner_id     BIGINT       NOT NULL,
    preferred_at DATETIME(6)  NOT NULL,
    proposed_at  DATETIME(6)  NULL,
    status       VARCHAR(25)  NOT NULL DEFAULT 'REQUESTED',
    buyer_note   VARCHAR(500) NULL,
    owner_note   VARCHAR(500) NULL,
    created_at   DATETIME(6)  NOT NULL,
    updated_at   DATETIME(6)  NOT NULL,
    version      INT          NOT NULL DEFAULT 0,
    CONSTRAINT fk_visit_property FOREIGN KEY (property_id) REFERENCES properties (id),
    CONSTRAINT fk_visit_buyer    FOREIGN KEY (buyer_id)    REFERENCES users (id),
    CONSTRAINT fk_visit_owner    FOREIGN KEY (owner_id)    REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_visit_owner ON site_visit_requests (owner_id, status);
CREATE INDEX idx_visit_buyer ON site_visit_requests (buyer_id, status);

CREATE TABLE reported_listings (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    property_id BIGINT        NOT NULL,
    reporter_id BIGINT        NULL,
    reason      VARCHAR(30)   NOT NULL,
    details     VARCHAR(1000) NULL,
    status      VARCHAR(15)   NOT NULL DEFAULT 'OPEN',
    resolved_by BIGINT        NULL,
    resolved_at DATETIME(6)   NULL,
    created_at  DATETIME(6)   NOT NULL,
    CONSTRAINT fk_report_property FOREIGN KEY (property_id) REFERENCES properties (id),
    CONSTRAINT fk_report_reporter FOREIGN KEY (reporter_id) REFERENCES users (id),
    CONSTRAINT fk_report_resolver FOREIGN KEY (resolved_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_report_status ON reported_listings (status, created_at);

CREATE TABLE verification_requests (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id      BIGINT       NOT NULL,
    property_id  BIGINT       NULL,
    type         VARCHAR(25)  NOT NULL,
    document_key VARCHAR(255) NULL COMMENT 'private storage key, never exposed publicly',
    status       VARCHAR(15)  NOT NULL DEFAULT 'PENDING',
    admin_note   VARCHAR(500) NULL,
    decided_by   BIGINT       NULL,
    decided_at   DATETIME(6)  NULL,
    created_at   DATETIME(6)  NOT NULL,
    CONSTRAINT fk_ver_user     FOREIGN KEY (user_id)     REFERENCES users (id),
    CONSTRAINT fk_ver_property FOREIGN KEY (property_id) REFERENCES properties (id),
    CONSTRAINT fk_ver_decider  FOREIGN KEY (decided_by)  REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_ver_status ON verification_requests (status, created_at);

CREATE TABLE promotion_packages (
    id            BIGINT AUTO_INCREMENT PRIMARY KEY,
    code          VARCHAR(40)   NOT NULL,
    name          VARCHAR(100)  NOT NULL,
    duration_days INT           NOT NULL,
    price         DECIMAL(10,2) NOT NULL,
    active        BOOLEAN       NOT NULL DEFAULT TRUE,
    CONSTRAINT uq_packages_code UNIQUE (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE listing_promotions (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    property_id BIGINT      NOT NULL,
    package_id  BIGINT      NOT NULL,
    starts_at   DATETIME(6) NOT NULL,
    ends_at     DATETIME(6) NOT NULL,
    source      VARCHAR(20) NOT NULL DEFAULT 'ADMIN_MANUAL',
    created_by  BIGINT      NOT NULL,
    created_at  DATETIME(6) NOT NULL,
    CONSTRAINT fk_promo_property FOREIGN KEY (property_id) REFERENCES properties (id),
    CONSTRAINT fk_promo_package  FOREIGN KEY (package_id)  REFERENCES promotion_packages (id),
    CONSTRAINT fk_promo_creator  FOREIGN KEY (created_by)  REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_promo_property ON listing_promotions (property_id, ends_at);

CREATE TABLE audit_logs (
    id          BIGINT AUTO_INCREMENT PRIMARY KEY,
    actor_id    BIGINT       NULL,
    action      VARCHAR(60)  NOT NULL,
    entity_type VARCHAR(40)  NOT NULL,
    entity_id   BIGINT       NULL,
    details     VARCHAR(2000) NULL,
    ip          VARCHAR(45)  NULL,
    created_at  DATETIME(6)  NOT NULL,
    CONSTRAINT fk_audit_actor FOREIGN KEY (actor_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
CREATE INDEX idx_audit_entity  ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_actor   ON audit_logs (actor_id);
CREATE INDEX idx_audit_created ON audit_logs (created_at);

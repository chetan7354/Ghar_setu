-- Reference data: roles, Gwalior and its localities, amenities, promotion packages.
-- Locality list is a starting set; admins can add more. PIN codes are indicative and
-- should be checked against India Post before launch.

INSERT INTO roles (id, name) VALUES (1, 'BUYER'), (2, 'SELLER'), (3, 'BUILDER'), (4, 'ADMIN');

INSERT INTO cities (id, name, state, slug, active) VALUES (1, 'Gwalior', 'Madhya Pradesh', 'gwalior', TRUE);

INSERT INTO localities (city_id, name, slug, pin_code, popular) VALUES
 (1, 'City Centre',      'city-centre',      '474011', TRUE),
 (1, 'Thatipur',         'thatipur',         '474011', TRUE),
 (1, 'DD Nagar',         'dd-nagar',         '474005', TRUE),
 (1, 'Morar',            'morar',            '474006', TRUE),
 (1, 'Lashkar',          'lashkar',          '474009', TRUE),
 (1, 'Gola Ka Mandir',   'gola-ka-mandir',   '474005', TRUE),
 (1, 'Shivpuri Link Road','shivpuri-link-road','474011', TRUE),
 (1, 'Jhansi Road',      'jhansi-road',      '474002', TRUE),
 (1, 'Kampoo',           'kampoo',           '474001', FALSE),
 (1, 'Phool Bagh',       'phool-bagh',       '474002', FALSE),
 (1, 'Naka Chandravadni','naka-chandravadni','474002', FALSE),
 (1, 'Hazira',           'hazira',           '474003', FALSE),
 (1, 'Gandhi Nagar',     'gandhi-nagar',     '474002', FALSE),
 (1, 'Vinay Nagar',      'vinay-nagar',      '474012', FALSE),
 (1, 'Tansen Nagar',     'tansen-nagar',     '474002', FALSE),
 (1, 'Airport Road',     'airport-road',     '474020', FALSE);

INSERT INTO amenities (code, label) VALUES
 ('PARKING', 'Car parking'), ('POWER_BACKUP', 'Power backup'), ('LIFT', 'Lift'),
 ('SECURITY', '24x7 security'), ('CCTV', 'CCTV'), ('WATER_SUPPLY', '24x7 water supply'),
 ('BOREWELL', 'Borewell'), ('GARDEN', 'Garden / park'), ('GYM', 'Gym'),
 ('CLUBHOUSE', 'Clubhouse'), ('GATED', 'Gated society'), ('VASTU', 'Vastu compliant'),
 ('CORNER', 'Corner property'), ('ROAD_FACING', 'Main road facing');

INSERT INTO promotion_packages (code, name, duration_days, price, active) VALUES
 ('FEATURED_7',  'Featured - 7 days',  7,  499.00, TRUE),
 ('FEATURED_30', 'Featured - 30 days', 30, 1499.00, TRUE);

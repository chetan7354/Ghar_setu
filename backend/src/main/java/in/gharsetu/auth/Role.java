package in.gharsetu.auth;

import java.util.Arrays;

/** Role ids match the rows seeded in V2__seed_reference_data.sql. */
public enum Role {
    BUYER((short) 1), SELLER((short) 2), BUILDER((short) 3), ADMIN((short) 4);

    private final short id;

    Role(short id) {
        this.id = id;
    }

    public short id() {
        return id;
    }

    public static Role fromId(short id) {
        return Arrays.stream(values()).filter(r -> r.id == id).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown role id " + id));
    }
}

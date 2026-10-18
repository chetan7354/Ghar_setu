package in.gharsetu.auth;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class RoleIdConverter implements AttributeConverter<Role, Short> {
    @Override
    public Short convertToDatabaseColumn(Role role) {
        return role == null ? null : role.id();
    }

    @Override
    public Role convertToEntityAttribute(Short id) {
        return id == null ? null : Role.fromId(id);
    }
}

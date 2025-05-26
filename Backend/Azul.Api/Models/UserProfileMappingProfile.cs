using AutoMapper;
using Azul.Api.Models.Input;
using Azul.Api.Models.Output;
using Azul.Core.UserAggregate;

namespace Azul.Api.Models;

public class UserProfileMappingProfile : Profile
{
    public UserProfileMappingProfile()
    {
        // User to UserDetailsOutputModel
        CreateMap<User, UserDetailsOutputModel>();

        // UpdateSettingsInputModel to User
        // This allows AutoMapper to update an existing User object with values from the input model.
        CreateMap<UpdateSettingsInputModel, User>();

        // Note: UpdateProfileInputModel to User is handled manually in UserController 
        // due to specific logic for email/username updates.
        // If DisplayName were the only field, CreateMap<UpdateProfileInputModel, User>(); could be used.
    }
} 
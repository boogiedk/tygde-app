using MeetingBackend.DTOs;

namespace MeetingBackend.Services;

public interface IMeetingService
{
    Task<CreateMeetingResponse> CreateMeetingAsync(CreateMeetingRequest request);
    Task<MeetingResponse?> GetMeetingByIdAsync(Guid id);
}

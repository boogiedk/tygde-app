using MeetingBackend.DTOs;

namespace MeetingBackend.Services;

public interface IMeetingService
{
    Task<MeetingResponse> CreateMeetingAsync(CreateMeetingRequest request);
    Task<MeetingResponse?> GetMeetingByIdAsync(Guid id);
}

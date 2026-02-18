using MeetingBackend.DTOs;

namespace MeetingBackend.Services;

public interface IParticipantService
{
    Task<JoinMeetingResponse> JoinMeetingAsync(Guid meetingId, JoinMeetingRequest request);
    Task<VerifyTokenResponse?> VerifyTokenAsync(Guid meetingId, string token);
    Task<List<ParticipantResponse>> GetParticipantsAsync(Guid meetingId);
    Task<bool> LeaveMeetingAsync(Guid meetingId, string token);
    Task<bool> UpdateLocationAsync(Guid meetingId, UpdateLocationRequest request);
    Task<MeetingPreviewResponse?> GetMeetingPreviewAsync(Guid meetingId);
}

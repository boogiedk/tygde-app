using MeetingBackend.Models;

namespace MeetingBackend.Repositories;

public interface IParticipantRepository
{
    Task<Participant> CreateAsync(Participant participant);
    Task<Participant?> GetByIdAsync(Guid id);
    Task<List<Participant>> GetByMeetingIdAsync(Guid meetingId);
    Task UpdateAsync(Participant participant);
}

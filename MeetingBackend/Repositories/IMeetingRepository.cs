using MeetingBackend.Models;

namespace MeetingBackend.Repositories;

public interface IMeetingRepository
{
    Task<Meeting> CreateMeetingAsync(Meeting meeting);
    Task<Meeting?> GetMeetingByIdAsync(Guid id);
}

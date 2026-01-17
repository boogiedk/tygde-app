using Microsoft.EntityFrameworkCore;
using MeetingBackend.Data;
using MeetingBackend.Models;

namespace MeetingBackend.Repositories;

public class MeetingRepository : IMeetingRepository
{
    private readonly ApplicationDbContext _context;

    public MeetingRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Meeting> CreateMeetingAsync(Meeting meeting)
    {
        _context.Meetings.Add(meeting);
        await _context.SaveChangesAsync();
        return meeting;
    }

    public async Task<Meeting?> GetMeetingByIdAsync(Guid id)
    {
        return await _context.Meetings.FindAsync(id);
    }
}

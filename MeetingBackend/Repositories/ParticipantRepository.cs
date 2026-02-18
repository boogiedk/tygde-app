using Microsoft.EntityFrameworkCore;
using MeetingBackend.Data;
using MeetingBackend.Models;

namespace MeetingBackend.Repositories;

public class ParticipantRepository : IParticipantRepository
{
    private readonly ApplicationDbContext _context;

    public ParticipantRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Participant> CreateAsync(Participant participant)
    {
        _context.Participants.Add(participant);
        await _context.SaveChangesAsync();
        return participant;
    }

    public async Task<Participant?> GetByIdAsync(Guid id)
    {
        return await _context.Participants.FindAsync(id);
    }

    public async Task<List<Participant>> GetByMeetingIdAsync(Guid meetingId)
    {
        return await _context.Participants
            .Where(p => p.MeetingId == meetingId)
            .OrderBy(p => p.JoinedAt)
            .ToListAsync();
    }

    public async Task UpdateAsync(Participant participant)
    {
        _context.Participants.Update(participant);
        await _context.SaveChangesAsync();
    }
}

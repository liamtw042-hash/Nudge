import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { AuthProvider } from '@/auth/AuthProvider';
import { repo } from '@/data';
import { todayIso } from '@/lib/dates';
import { Dashboard } from '@/pages/Dashboard';
import { ParentSlip } from '@/pages/ParentSlip';
import { SignIn } from '@/pages/SignIn';
import { StudentPage } from '@/pages/StudentPage';

function app(initial: string) {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <AuthProvider>
        <Routes>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/app" element={<Dashboard />} />
          <Route path="/app/students/:id" element={<StudentPage />} />
          <Route path="/s/:token" element={<ParentSlip />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('core flows (local mode)', () => {
  it('signs in, adds a student, writes a slip, and a parent ticks a day', async () => {
    const user = userEvent.setup();

    // 1. Sign in (local mode creates the teacher with a trial).
    app('/signin');
    await user.type(screen.getByLabelText('Your name'), 'Ms Chen');
    await user.type(screen.getByLabelText('Email'), 'chen@example.com');
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Students' })).toBeInTheDocument());

    // 2. Add a student.
    await user.click(screen.getByRole('button', { name: '+ Add student' }));
    await user.type(screen.getByLabelText("Student's first name"), 'Ava');
    await user.click(screen.getByRole('button', { name: 'Add' }));
    const row = await screen.findByRole('link', { name: /Ava/ });
    expect(within(row).getByText('No slip yet')).toBeInTheDocument();

    const students = await repo().listStudents('local-chen@example.com');
    expect(students).toHaveLength(1);
    const ava = students[0]!;
    expect(ava.id).toHaveLength(22);

    // 3. Write the first slip.
    await user.click(row);
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Ava' })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: 'Write first slip' }));
    await user.type(screen.getByLabelText('Item 1 title'), 'Minuet in G');
    await user.type(screen.getByLabelText('Item 1 instruction'), 'bars 1–8 slowly');
    await user.click(screen.getByRole('button', { name: '+ Scales' }));
    await user.click(screen.getByRole('button', { name: 'Save slip' }));
    await waitFor(() => expect(screen.getByText('Minuet in G')).toBeInTheDocument());
    expect(screen.getByText('Scales')).toBeInTheDocument();
    expect(screen.getByText(/0 of 5 days/)).toBeInTheDocument();

    const saved = await repo().getStudentPublic(ava.id);
    expect(saved?.slip?.items.map((i) => i.title)).toEqual(['Minuet in G', 'Scales']);
    expect(saved?.slip?.startDate).toBe(todayIso());
  });

  it('lets a parent open the link, tick today, and leave a note', async () => {
    const user = userEvent.setup();
    const today = todayIso();
    await repo().createStudent({
      id: 'tokentokentokentokenAB',
      teacherId: 't1',
      teacherName: 'Ms Chen',
      name: 'Ava',
      instrument: 'Piano',
      parentName: 'Priya',
      archived: false,
      createdAt: 1,
      updatedAt: 1,
      slip: { id: 's', startDate: today, items: [{ id: 'i', title: 'Minuet in G', instruction: 'slowly' }], targetDays: 5, note: 'Little and often.', writtenAt: 1 },
      log: {},
      parentNote: null,
    });

    app('/s/tokentokentokentokenAB');
    await waitFor(() => expect(screen.getByRole('heading', { name: "Ava's practice this week" })).toBeInTheDocument());
    expect(screen.getByText('Little and often.')).toBeInTheDocument();

    const days = screen.getByRole('group', { name: 'Practice days' });
    const buttons = within(days).getAllByRole('button');
    expect(buttons).toHaveLength(7);
    // Only today is tappable on a slip written today; the rest are in the future.
    expect(buttons.filter((b) => !(b as HTMLButtonElement).disabled)).toHaveLength(1);
    await user.click(buttons[0]!);
    await waitFor(() => expect(buttons[0]).toHaveAttribute('aria-pressed', 'true'));
    expect((await repo().getStudentPublic('tokentokentokentokenAB'))?.log).toEqual({ [today]: true });
    expect(screen.getByText('1 down, 4 to go.')).toBeInTheDocument();

    await user.type(screen.getByLabelText(/Anything Ms Chen should know/), 'Bar 6 kept going wrong');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(screen.getByText(/Sent\./)).toBeInTheDocument());
    expect((await repo().getStudentPublic('tokentokentokentokenAB'))?.parentNote?.text).toBe('Bar 6 kept going wrong');

    const events = await repo().adminListEvents(0);
    expect(events.map((e) => e.type)).toEqual(['parent_opened', 'day_ticked', 'parent_note']);
  });

  it('shows a clear message for a dead link', async () => {
    app('/s/nope');
    await waitFor(() => expect(screen.getByText("This link isn't active")).toBeInTheDocument());
  });
});

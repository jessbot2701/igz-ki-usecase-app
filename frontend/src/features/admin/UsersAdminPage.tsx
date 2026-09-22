import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { CreateUserInput, userApi } from '../../api/userApi';
import { ROLE_LABELS, Role, User } from '../../types';
import { useNotification } from '../../context/NotificationContext';

function CreateUserDialog({
  open,
  onClose,
  onCreate,
  submitting
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: CreateUserInput) => void;
  submitting: boolean;
}) {
  const [form, setForm] = useState<CreateUserInput>({
    name: '',
    email: '',
    password: '',
    role: Role.EMPLOYEE,
    department: ''
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Neuen Benutzer anlegen</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            fullWidth
          />
          <TextField
            label="E-Mail"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            fullWidth
          />
          <TextField
            label="Initiales Passwort"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            fullWidth
          />
          <TextField
            select
            label="Rolle"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            fullWidth
          >
            {Object.values(Role).map((r) => (
              <MenuItem key={r} value={r}>
                {ROLE_LABELS[r]}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Bereich"
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            fullWidth
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button variant="contained" disabled={submitting} onClick={() => onCreate(form)}>
          Anlegen
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function UsersAdminPage() {
  const queryClient = useQueryClient();
  const { notify } = useNotification();
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ['admin-users'], queryFn: userApi.list });

  const createMutation = useMutation({
    mutationFn: userApi.create,
    onSuccess: () => {
      setCreateOpen(false);
      notify('Benutzer wurde angelegt.', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => userApi.update(id, { active }),
    onSuccess: () => {
      notify('Benutzerstatus wurde aktualisiert.', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    }
  });

  const columns: GridColDef<User>[] = [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 160 },
    { field: 'email', headerName: 'E-Mail', flex: 1.2, minWidth: 200 },
    {
      field: 'role',
      headerName: 'Rolle',
      flex: 0.8,
      minWidth: 150,
      renderCell: (params) => <Chip label={ROLE_LABELS[params.value as Role]} size="small" />
    },
    { field: 'department', headerName: 'Bereich', flex: 0.8, minWidth: 140 },
    {
      field: 'active',
      headerName: 'Aktiv',
      flex: 0.5,
      minWidth: 100,
      renderCell: (params) => (
        <Switch
          checked={Boolean(params.value)}
          onChange={(e) =>
            toggleActiveMutation.mutate({ id: params.row.id, active: e.target.checked })
          }
        />
      )
    }
  ];

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4">Benutzerverwaltung</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
          Neuer Benutzer
        </Button>
      </Stack>
      <Box sx={{ height: 520, bgcolor: 'background.paper', borderRadius: 2 }}>
        <DataGrid
          rows={data ?? []}
          columns={columns}
          loading={isLoading}
          disableRowSelectionOnClick
          sx={{ border: 'none' }}
        />
      </Box>
      <CreateUserDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        submitting={createMutation.isPending}
        onCreate={(input) => createMutation.mutate(input)}
      />
    </Box>
  );
}

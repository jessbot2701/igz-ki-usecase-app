import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { departmentApi } from '../../api/departmentApi';
import { Department } from '../../types';
import { useNotification } from '../../context/NotificationContext';
import { dataGridSx } from '../../theme/theme';

function DepartmentDialog({
  open,
  initialName,
  submitting,
  onClose,
  onSave
}: {
  open: boolean;
  initialName?: string;
  submitting: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [name, setName] = useState(initialName ?? '');

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{initialName ? 'Bereich bearbeiten' : 'Bereich anlegen'}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          label="Bereichsname"
          value={name}
          onChange={(event) => setName(event.target.value)}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Abbrechen</Button>
        <Button variant="contained" disabled={submitting || name.trim().length < 2} onClick={() => onSave(name.trim())}>
          Speichern
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function MasterDataPage() {
  const queryClient = useQueryClient();
  const { notify } = useNotification();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ['admin-departments'],
    queryFn: () => departmentApi.list(true)
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['admin-departments'] });
  const createMutation = useMutation({
    mutationFn: departmentApi.create,
    onSuccess: () => {
      setDialogOpen(false);
      notify('Bereich wurde angelegt.', 'success');
      refresh();
    }
  });
  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<Pick<Department, 'name' | 'active'>> }) =>
      departmentApi.update(id, input),
    onSuccess: () => {
      setEditing(null);
      notify('Bereich wurde aktualisiert.', 'success');
      refresh();
    }
  });
  const deleteMutation = useMutation({
    mutationFn: departmentApi.remove,
    onSuccess: () => {
      notify('Bereich wurde gelöscht.', 'success');
      refresh();
    }
  });

  const toggleActive = (department: Department) => {
    updateMutation.mutate({ id: department.id, input: { active: !department.active } });
  };

  const columns: GridColDef<Department>[] = [
    { field: 'name', headerName: 'Bereich', flex: 1.4, minWidth: 220 },
    {
      field: 'active',
      headerName: 'Aktiv',
      width: 120,
      renderCell: (params) => (
        <Switch checked={params.row.active} onChange={() => toggleActive(params.row)} />
      )
    },
    {
      field: 'actions',
      headerName: 'Aktionen',
      width: 220,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Button size="small" variant="outlined" onClick={() => setEditing(params.row)}>Bearbeiten</Button>
          <Button size="small" color="error" onClick={() => deleteMutation.mutate(params.row.id)}>Löschen</Button>
        </Stack>
      )
    }
  ];

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'flex-end' }} spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="overline" sx={{ color: 'primary.light', fontWeight: 800, letterSpacing: '0.12em' }}>
            Administration
          </Typography>
          <Typography variant="h4">Stammdaten</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            Bereiche pflegen und als Auswahl für Benutzer und Use Cases bereitstellen.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          Neuer Bereich
        </Button>
      </Stack>

      <Paper elevation={0} sx={{ height: 500, overflow: 'hidden', borderRadius: 2, display: { xs: 'none', md: 'block' } }}>
        <DataGrid rows={data ?? []} columns={columns} loading={isLoading} getRowId={(row) => row.id} disableRowSelectionOnClick sx={{ ...dataGridSx, cursor: 'default' }} />
      </Paper>
      <Stack spacing={1.25} sx={{ display: { xs: 'flex', md: 'none' } }}>
        {data?.map((department) => (
          <Card key={department.id}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{department.name}</Typography>
                  <Chip size="small" label={department.active ? 'Aktiv' : 'Deaktiviert'} color={department.active ? 'success' : 'default'} sx={{ mt: 1 }} />
                </Box>
                <Switch checked={department.active} onChange={() => toggleActive(department)} />
              </Stack>
              <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                <Button size="small" variant="outlined" onClick={() => setEditing(department)}>Bearbeiten</Button>
                <Button size="small" color="error" onClick={() => deleteMutation.mutate(department.id)}>Löschen</Button>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <DepartmentDialog
        open={dialogOpen}
        submitting={createMutation.isPending}
        onClose={() => setDialogOpen(false)}
        onSave={(name) => createMutation.mutate(name)}
      />
      <DepartmentDialog
        key={editing?.id ?? 'edit-department'}
        open={Boolean(editing)}
        initialName={editing?.name}
        submitting={updateMutation.isPending}
        onClose={() => setEditing(null)}
        onSave={(name) => editing && updateMutation.mutate({ id: editing.id, input: { name } })}
      />
    </Box>
  );
}

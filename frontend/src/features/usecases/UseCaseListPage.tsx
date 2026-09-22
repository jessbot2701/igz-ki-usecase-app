import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { DataGrid, GridColDef, GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
import { useCaseApi } from '../../api/useCaseApi';
import { StatusChip } from '../../components/StatusChip';
import { STATUS_LABELS, UseCase, UseCaseStatus } from '../../types';
import { UseCaseWizardDialog } from './UseCaseWizardDialog';
import { UseCaseFormData } from './UseCaseForm';
import { useNotification } from '../../context/NotificationContext';

export function UseCaseListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notify } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [status, setStatus] = useState<UseCaseStatus | ''>(
    (searchParams.get('status') as UseCaseStatus) ?? ''
  );
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 10 });
  const [sortModel, setSortModel] = useState<GridSortModel>([{ field: 'updatedAt', sort: 'desc' }]);
  const [createOpen, setCreateOpen] = useState(false);

  // Keeps the grid in sync when navigating here (e.g. from the topbar search or dashboard
  // KPI cards) while already on this route, where React Router does not remount the page.
  useEffect(() => {
    setSearch(searchParams.get('search') ?? '');
    setStatus((searchParams.get('status') as UseCaseStatus) ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const queryParams = useMemo(
    () => ({
      search: search || undefined,
      status: status || undefined,
      page: paginationModel.page + 1,
      pageSize: paginationModel.pageSize,
      sortBy: sortModel[0]?.field ?? 'updatedAt',
      sortDir: (sortModel[0]?.sort ?? 'desc') as 'asc' | 'desc'
    }),
    [search, status, paginationModel, sortModel]
  );

  const { data, isLoading } = useQuery({
    queryKey: ['use-cases', queryParams],
    queryFn: () => useCaseApi.search(queryParams)
  });

  const createMutation = useMutation({
    mutationFn: (values: UseCaseFormData) => useCaseApi.create(values),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['use-cases'] });
      setCreateOpen(false);
      notify('Use Case wurde angelegt.', 'success');
      navigate(`/use-cases/${created.id}`);
    }
  });

  const columns: GridColDef<UseCase>[] = [
    { field: 'title', headerName: 'Titel', flex: 1.4, minWidth: 200 },
    { field: 'department', headerName: 'Bereich', flex: 0.8, minWidth: 120 },
    { field: 'requestor', headerName: 'Einreicher', flex: 0.8, minWidth: 140 },
    {
      field: 'status',
      headerName: 'Status',
      flex: 0.8,
      minWidth: 150,
      renderCell: (params) => <StatusChip status={params.value as UseCaseStatus} />
    },
    {
      field: 'updatedAt',
      headerName: 'Aktualisiert',
      flex: 0.8,
      minWidth: 160,
      valueFormatter: (value: string) => new Date(value).toLocaleString('de-DE')
    }
  ];

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h4">Use Cases</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
          Neuer Use Case
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="Suche (Titel, Bereich, Einreicher)"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSearchParams((p) => {
              p.set('search', e.target.value);
              return p;
            });
          }}
          sx={{ minWidth: 280 }}
        />
        <TextField
          select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as UseCaseStatus | '')}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">Alle</MenuItem>
          {Object.values(UseCaseStatus).map((s) => (
            <MenuItem key={s} value={s}>
              {STATUS_LABELS[s]}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <Box sx={{ height: 560, bgcolor: 'background.paper', borderRadius: 2 }}>
        <DataGrid
          rows={data?.items ?? []}
          columns={columns}
          loading={isLoading}
          rowCount={data?.total ?? 0}
          paginationMode="server"
          sortingMode="server"
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          pageSizeOptions={[10, 20, 50]}
          disableRowSelectionOnClick
          onRowClick={(params) => navigate(`/use-cases/${params.id}`)}
          sx={{ border: 'none', cursor: 'pointer' }}
        />
      </Box>

      <UseCaseWizardDialog
        open={createOpen}
        title="Neuen Use Case anlegen"
        submitting={createMutation.isPending}
        onClose={() => setCreateOpen(false)}
        onSubmit={(values) => createMutation.mutate(values)}
      />
    </Box>
  );
}

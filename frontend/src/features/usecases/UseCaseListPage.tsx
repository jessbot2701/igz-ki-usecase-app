import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/SearchOutlined';
import { DataGrid, GridColDef, GridPaginationModel, GridSortModel } from '@mui/x-data-grid';
import { useCaseApi } from '../../api/useCaseApi';
import { StatusChip } from '../../components/StatusChip';
import { STATUS_LABELS, UseCase, UseCaseStatus } from '../../types';
import { UseCaseWizardDialog } from './UseCaseWizardDialog';
import { UseCaseFormData } from './UseCaseForm';
import { useNotification } from '../../context/NotificationContext';
import { dataGridSx } from '../../theme/theme';

export function UseCaseListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notify } = useNotification();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [status, setStatus] = useState<UseCaseStatus | ''>(
    (searchParams.get('status') as UseCaseStatus) ?? ''
  );
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10
  });
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

  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / paginationModel.pageSize));

  return (
    <Box>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'flex-end' }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography
            variant="overline"
            sx={{ color: 'primary.light', fontWeight: 800, letterSpacing: '0.12em' }}
          >
            Portfolio
          </Typography>
          <Typography variant="h4">Use Cases</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
            Ideen, Bewertungen und Umsetzung zentral im Blick behalten.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
          Neuer Use Case
        </Button>
      </Stack>

      <Paper elevation={0} sx={{ p: 2, mb: 2, border: 1, borderColor: 'divider', borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <TextField
            placeholder="Titel, Bereich oder Einreicher suchen"
            size="small"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSearchParams((p) => {
                p.set('search', e.target.value);
                return p;
              });
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" color="action" />
                </InputAdornment>
              )
            }}
            sx={{ minWidth: { sm: 360 } }}
          />
          <TextField
            select
            label="Status"
            size="small"
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
      </Paper>

      <Paper
        elevation={0}
        sx={{
          height: 590,
          overflow: 'hidden',
          borderRadius: 2,
          display: { xs: 'none', md: 'block' }
        }}
      >
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
          rowHeight={64}
          disableRowSelectionOnClick
          onRowClick={(params) => navigate(`/use-cases/${params.id}`)}
          sx={dataGridSx}
        />
      </Paper>

      <Stack spacing={1.25} sx={{ display: { xs: 'flex', md: 'none' } }}>
        {data?.items.map((useCase) => (
          <Card key={useCase.id}>
            <CardActionArea onClick={() => navigate(`/use-cases/${useCase.id}`)}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="flex-start"
                  spacing={1.5}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                    {useCase.title}
                  </Typography>
                  <StatusChip status={useCase.status} />
                </Stack>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {useCase.department} · {useCase.requestor}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mt: 1, display: 'block' }}
                >
                  Aktualisiert {new Date(useCase.updatedAt).toLocaleString('de-DE')}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
        {!isLoading && data?.items.length === 0 && (
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">Keine Use Cases gefunden.</Typography>
          </Card>
        )}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ pt: 1 }}>
          <Button
            size="small"
            disabled={paginationModel.page === 0}
            onClick={() => setPaginationModel((model) => ({ ...model, page: model.page - 1 }))}
          >
            Zurück
          </Button>
          <Typography variant="caption" color="text.secondary">
            Seite {paginationModel.page + 1} von {totalPages}
          </Typography>
          <Button
            size="small"
            disabled={paginationModel.page + 1 >= totalPages}
            onClick={() => setPaginationModel((model) => ({ ...model, page: model.page + 1 }))}
          >
            Weiter
          </Button>
        </Stack>
      </Stack>

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

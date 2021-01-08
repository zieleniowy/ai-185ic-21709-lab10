import React from 'react';
import {Container, Grid, List, ListItem, ListItemText, Box, Button, ListItemIcon, ListItemSecondaryAction, 
  IconButton, Checkbox, TextField, Card, CardContent, CardHeader, MenuItem, Typography, Dialog, DialogTitle, 
DialogContent } from '@material-ui/core';
import { Remove, Delete, Edit, Save, Cancel } from '@material-ui/icons';
import { useSnackbar } from 'notistack';
import fetch from './fetch';


const Lists = props => {
  const {lists, setLists, selected, setSelected} = props;
  const [name, setName] = React.useState('');
  const handleChange = e=>setName(e.target.value);
  const handleAdd = ()=>fetch(name, { method: "POST", body: [] }).then(()=>setLists([...lists, name])).then(()=>setName("")).catch(console.error);
  const handleRemove = list => 
        () => fetch(list, { method: "DELETE" })
            .then(()=>setLists(lists.filter(f=>f!==list)))
            .catch(props.onError)
  const handleSelect = list => ()=>setSelected(list)
  return (
    <List>
      {lists.map(list=>(
        <ListItem onClick={handleSelect(list)} button key={list}>
          <ListItemText primary={list}/>
          <ListItemSecondaryAction>
            <IconButton onClick={handleRemove(list)}>
              <Remove />
            </IconButton>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
      <ListItem>
        <TextField value={name} onChange={handleChange} fullWidth label="nazwa listy" />
      </ListItem>
      <ListItem>
        <Button onClick={handleAdd} fullWidth variant="outlined" color="primary">utwórz nową listę</Button>
      </ListItem>
    </List>
  )
}

const AddTask = props => {
  const [label, setLabel] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const handleChange = setter => e =>setter(e.target.value);
  const handleSave = ()=>{
    props.onSave({ label, desc, done: false })
      .then(()=>{
        setLabel("");
        setDesc("");
      })
  }
  return (
    <Card>
      <CardHeader title="Dodaj nowe zadanie"/>
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField onChange={handleChange(setLabel)} value={label} fullWidth variant="outlined" label="Tytuł" />
          </Grid>
          <Grid item xs={12}>
            <TextField onChange={handleChange(setDesc)} value={desc} variant="outlined" fullWidth label="Opis" />
          </Grid>
          <Grid item xs={12}>
            <Button onClick={handleSave} fullWidth variant="outlined" color="primary">Nowe zadanie</Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )
}

const Task = props =>{
  const [isEditing, setEditMode] = React.useState(false);
  const [localTask, setLocalTask] = React.useState(props.task) 
  const {id, label, desc, done} = props.task;
  const handleUpdate = prop => eventOrValue => props.onUpdate(typeof prop === 'object'?prop:{ id, label, desc, done, [prop]: eventOrValue.target?.checked??eventOrValue.target?.value??eventOrValue })
  const handleClick = ()=>!isEditing&&handleUpdate('done')(!done)
  const handleToggleEditMode = e=> { setEditMode(!isEditing); e.stopPropagation();  };
  const handleLocalUpdate = prop => e => setLocalTask({...localTask, [prop]: e.target.value});
  const handleSave = ()=>{
    handleUpdate(localTask)();
    setEditMode(false);
  }
  const handleCancel = ()=>{
    setEditMode(false);
    setLocalTask(props.task);
  }
  const handleRemove = e=>{ props.onUpdate({id}, true); e.stopPropagation(); }
  return (
    <ListItem button={!isEditing} onClick={handleClick}>
      {isEditing?(
        <>
          <TextField onChange={handleLocalUpdate('label')} fullWidth label="Tytuł" value={localTask.label} />
          <TextField onChange={handleLocalUpdate('desc')} fullWidth label="Opis" value={localTask.desc} />
          <IconButton onClick={handleSave}><Save /></IconButton>
          <IconButton onClick={handleCancel}><Cancel /></IconButton>
        </>
      ):(
        <>
          <ListItemIcon><Checkbox checked={done} onChange={handleUpdate('done')} /></ListItemIcon>
          <ListItemText primary={label} secondary={desc} />
          <ListItemSecondaryAction>
            <IconButton onClick={handleToggleEditMode}>
              <Edit />
            </IconButton>
            <IconButton onClick={handleRemove}>
              <Delete />
            </IconButton>
          </ListItemSecondaryAction>
        </>
      )}

    </ListItem>
  )
}

const LoginForm = props => {
  const [login, setLogin] = React.useState("");
  const [pass, setPass] = React.useState("");
  const handleChange = setter => e =>setter(e.target.value);
  const handleSend = ()=>{
    fetch("/auth", { method: "POST", body: { login, pass } })
      .then(props.onSuccess)
      .catch(props.onError)
  }
  return (
    <Dialog open={true} maxWidth="xs" fullWidth>
      <DialogTitle>Wymagana autoryzacja</DialogTitle>
      <DialogContent>
          <TextField fullWidth value={login} onChange={handleChange(setLogin)} label="login" />
          <TextField fullWidth type="password" value={pass} onChange={handleChange(setPass)} label="hasło" />
          <Box pt={2}><Button onClick={handleSend} fullWidth variant="outlined" color="primary">Zaloguj</Button></Box>
      </DialogContent>
  </Dialog>
  )
}

export default function App() {
  const [lists, setLists] = React.useState([]);
  const [selected, setSelected] = React.useState(null);
  const [tasks, setTasks] = React.useState([]);
  const [isLogged, setLogged] = React.useState(null);
  const { enqueueSnackbar } = useSnackbar();
  const handleListsRefresh = () => 
          fetch('/keys')
            .then((newLists)=>{ if(!lists.length) setSelected(newLists[0]); setLists(newLists); setLogged(true); return lists })
            .catch(err=>{ if(err.status===401) setLogged(false); return err; });
  const handleError  = (err="wystąpił błąd") => () =>enqueueSnackbar(err, { variant: "error" });
  const handleLogin = ()=>setLogged(true);
  const handleUpdateTask = (task, remove=false)=>{
    const index = tasks.findIndex(f=>f.id===task.id)
    const newTasks = index===-1?
      [...tasks, {...task, id: new Date()*1}]
      :[...tasks.slice(0, index), remove?false:task, ...tasks.slice(index+1)].filter(Boolean);
    return fetch(selected, { method: "PUT", body: newTasks })
      .then(()=>setTasks(newTasks))
      .catch(handleError("Aktualizacja zadań nie powiodła się"));
  };
  React.useEffect(()=>{
    if(!lists.includes(selected)) setSelected(lists[0]||null)
  }, [lists])
  React.useEffect(()=>{
    if(selected)
      fetch(selected)
        .then(setTasks)
        .catch(console.error);
  },[selected])
  React.useEffect(()=>{
    handleListsRefresh();
  }, [isLogged])
  return (
    <Container maxWidth="md">
      <Box py={4}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={9}>
            {selected&&(
              <>
                <Typography variant="h4">{selected}</Typography>
                <List>
                  {tasks.map(task=><Task onError={handleError("Aktualizacja Zadania nie powiodła się")} onUpdate={handleUpdateTask} key={task.id} task={task} />)}
                </List>
                <AddTask onError={handleError("Dodanie zadania nie powiodło się")} onSave={handleUpdateTask} />
              </>
            )}
          </Grid>
          <Grid item xs={12} md={3}>
              <Lists onError={handleError("Pobranie list nie powiodło się")} selected={selected} setSelected={setSelected} setLists={setLists} lists={lists} />
          </Grid>
        </Grid>
      </Box>
      {!isLogged&&<LoginForm onError={handleError("Logowanie nie powiodło się")} onSuccess={handleLogin} />}
    </Container>
  );
}

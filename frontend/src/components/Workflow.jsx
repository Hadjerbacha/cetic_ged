import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Form, Badge } from 'react-bootstrap';
import './workflow.css';
import AssignTask from './AssignTask';

const Workflow = () => {
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'Normal',
    assigned_to: '',
    file: null,
    notify: false
  });
  const [mode, setMode] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [document, setDocument] = useState(null);
  const [searchUser, setSearchUser] = useState('');
  const [note, setNote] = useState('');
  const [sendNotification, setSendNotification] = useState(false);

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/tasks');
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'file') {
      setFormData({ ...formData, file: e.target.files[0] });
    } else {
      setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    }
  };

  const handleSubmitNewTask = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'file' && value) data.append('file', value);
      else data.append(key, value);
    });
    data.append('workflow_id', 1); // temporairement fixe

    try {
      await axios.post('http://localhost:5000/api/tasks', data);
      fetchTasks();
      setShowModal(false);
      setFormData({
        title: '', description: '', due_date: '', priority: 'Normal',
        assigned_to: '', file: null, notify: false
      });
    } catch (err) {
      console.error(err);
    }
  };

  
  const handleModeChange = (e) => {
    const selectedMode = e.target.value;
    setMode(selectedMode);
    setShowModal(selectedMode !== '');
  };
  
  useEffect(() => {
    fetchAssignTasks();
    fetchAssignUsers();
  }, []);

  const fetchAssignTasks = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/tasks');
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAssignUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'file') {
      setFormData({ ...formData, file: e.target.files[0] });
    } else {
      setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    }
  };

  

  const handleUserSelect = (user) => {
    if (!selectedUsers.find((u) => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleUserRemove = (userId) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
  };

  const handleSubmitAssignTask = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('file', document);
    formData.append('note', note);
    formData.append('notify', sendNotification);
    formData.append('assigned_to', JSON.stringify(selectedUsers.map((u) => u.id)));

    try {
      await axios.post('http://localhost:5000/api/assign-task', formData);
      setShowModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchUser.toLowerCase())
  );

  const handleAssignModeChange = (e) => {
    setMode(e.target.value);
    setShowAssignModal(true);
  };


  return (
    <div className="container mt-5">
      <h2 className="mb-4">Gestion des Workflows</h2>

      <Form.Group className="mb-3">
        <Form.Label>Choisir une action :</Form.Label>
        <Form.Select onChange={handleModeChange} value={mode}>
          <option value="">-- Sélectionner --</option>
          <option value="new">Nouvelle tâche</option>
          <option value="assign">Assigner une tâche</option>
        </Form.Select>
      </Form.Group>

      {/* Modal de création d'une nouvelle tâche */}
      <Modal show={showModal} onHide={() => { setShowModal(false); setMode(''); }}>
      <Modal.Header closeButton>
        <Modal.Title>
          {mode === 'new' ? 'Nouvelle Tâche' : mode === 'assign' ? 'Assigner une Tâche' : ''}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
          {mode === 'new' && (
            // Ton formulaire de création ici
            <Form onSubmit={handleSubmitNewTask}>
                  <Form.Group className="mb-3">
                    <Form.Label>Titre</Form.Label>
                    <Form.Control type="text" name="title" value={formData.title} onChange={handleChange} required />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Description</Form.Label>
                    <Form.Control as="textarea" name="description" value={formData.description} onChange={handleChange} />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Échéance</Form.Label>
                    <Form.Control type="date" name="due_date" value={formData.due_date} onChange={handleChange} required />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Priorité</Form.Label>
                    <Form.Select name="priority" value={formData.priority} onChange={handleChange}>
                      <option value="Haute">Haute</option>
                      <option value="Normale">Normale</option>
                      <option value="Basse">Basse</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Assigner à</Form.Label>
                    <Form.Select name="assigned_to" value={formData.assigned_to} onChange={handleChange}>
                      <option value="">Choisir un utilisateur</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>{u.username}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Fichier</Form.Label>
                    <Form.Control type="file" name="file" onChange={handleChange} />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Check type="checkbox" label="Envoyer une notification par email" name="notify" checked={formData.notify} onChange={handleChange} />
                  </Form.Group>
                  <Button variant="success" type="submit">Ajouter</Button>
                </Form>
          )}

          {mode === 'assign' && (
            // Formulaire pour assigner une tâche
            <Form onSubmit={handleSubmitAssignTask}>
              <Form.Group className="mb-3">
                <Form.Label>Choisir un document</Form.Label>
                <Form.Control type="file" onChange={(e) => setDocument(e.target.files[0])} />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Rechercher un utilisateur</Form.Label>
                <Form.Control type="text" placeholder="Nom ou rôle" value={searchUser} onChange={(e) => setSearchUser(e.target.value)} />
                <div className="mt-2" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="d-flex justify-content-between align-items-center border p-2 mb-1">
                      <span>{user.username} ({user.role})</span>
                      <Button size="sm" onClick={() => handleUserSelect(user)}>Ajouter</Button>
                    </div>
                  ))}
                </div>
              </Form.Group>

              <div className="mb-3">
                <Form.Label>Utilisateurs assignés</Form.Label>
                <div>
                  {selectedUsers.map((u) => (
                    <Badge key={u.id} pill bg="primary" className="me-2 mb-2" onClick={() => handleUserRemove(u.id)} style={{ cursor: 'pointer' }}>
                      {u.username} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <Form.Group className="mb-3">
                <Form.Label>Note / Instructions</Form.Label>
                <Form.Control as="textarea" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
              </Form.Group>

              <Form.Check type="checkbox" label="Envoyer une notification par email" checked={sendNotification} onChange={(e) => setSendNotification(e.target.checked)} />

              <Button variant="primary" type="submit">Assigner</Button>
            </Form>
          )}

    </Modal.Body>
  </Modal>


      {/* Tableau des tâches */}
      <table className="table table-striped mt-4">
        <thead className="table-dark">
          <tr>
            <th>Titre</th>
            <th>Description</th>
            <th>Échéance</th>
            <th>Priorité</th>
            <th>Assigné à</th>
            <th>Fichier</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id}>
              <td>{task.title}</td>
              <td>{task.description}</td>
              <td>{task.due_date}</td>
              <td>{task.priority}</td>
              <td>{task.assigned_to}</td>
              <td>{task.file_path ? <a href={`http://localhost:5000/${task.file_path}`} target="_blank" rel="noreferrer">Voir</a> : 'Aucun'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Workflow;

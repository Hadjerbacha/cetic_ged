import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Modal, Button, Form, Alert, Spinner, Badge } from 'react-bootstrap';
import './workflow.css';
const token = localStorage.getItem("token");

const Workflowss = () => {
  // États principaux
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // États pour la modal de création de tâche
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    due_date: '',
    priority: 'Normale',
    file: null,
    notify: false
  });

  // États pour la modal d'assignation
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({
    document: null,
    note: '',
    selectedUsers: [],
    searchUser: '',
    sendNotification: false
  });

  // Chargement initial des données
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, usersRes] = await Promise.all([
            axios.get('http://localhost:5000/api/tasks', {
                headers: {
                  Authorization: `Bearer ${token}`, // Ajouter le token dans l'en-tête
                },
              }),
              axios.get('http://localhost:5000/api/auth/users', {
                headers: {
                  Authorization: `Bearer ${token}`, // Ajouter le token dans l'en-tête
                },
              }),
        ]);
        setTasks(tasksRes.data);
        setUsers(usersRes.data);
      } catch (err) {
        setError('Erreur de chargement des données');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Gestion des tâches
  const fetchTasks = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/tasks', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
      setTasks(res.data);
    } catch (err) {
      setError('Erreur de rafraîchissement des tâches');
    }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    Object.entries(taskForm).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });

    try {
      await axios.post('http://localhost:5000/api/tasks', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await fetchTasks();
      setShowTaskModal(false);
      setTaskForm({
        title: '',
        description: '',
        due_date: '',
        priority: 'Normale',
        file: null,
        notify: false
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur de création');
    } finally {
      setLoading(false);
    }
  };

  // Gestion de l'assignation
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    formData.append('file', assignForm.document);
    formData.append('note', assignForm.note);
    formData.append('notify', assignForm.sendNotification);
    formData.append('assigned_to', JSON.stringify(assignForm.selectedUsers.map(u => u.id)));

    try {
      await axios.post('http://localhost:5000/api/assign-task', formData);
      await fetchTasks();
      setShowAssignModal(false);
      setAssignForm({
        document: null,
        note: '',
        selectedUsers: [],
        searchUser: '',
        sendNotification: false
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur d\'assignation');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user) => {
    if (!assignForm.selectedUsers.some(u => u.id === user.id)) {
      setAssignForm(prev => ({
        ...prev,
        selectedUsers: [...prev.selectedUsers, user],
        searchUser: ''
      }));
    }
  };

  const handleUserRemove = (userId) => {
    setAssignForm(prev => ({
      ...prev,
      selectedUsers: prev.selectedUsers.filter(u => u.id !== userId)
    }));
  };

  // Filtrage des utilisateurs
  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(assignForm.searchUser.toLowerCase()) ||
    user.role.toLowerCase().includes(assignForm.searchUser.toLowerCase())
  );

  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Chargement...</span>
        </Spinner>
      </div>
    );
  }

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Gestion des Workflows</h2>

      {error && (
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      <Form.Group className="mb-3">
        <Form.Label>Choisir une action :</Form.Label>
        <Form.Select onChange={(e) => {
          const action = e.target.value;
          if (action === 'new') setShowTaskModal(true);
          if (action === 'assign') setShowAssignModal(true);
        }}>
          <option value="">-- Sélectionner --</option>
          <option value="new">Nouvelle tâche</option>
          <option value="assign">Assigner une tâche</option>
        </Form.Select>
      </Form.Group>

      {/* Modal de création de tâche */}
      <Modal show={showTaskModal} onHide={() => setShowTaskModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Nouvelle Tâche</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleTaskSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Titre *</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={taskForm.title}
                onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="description"
                value={taskForm.description}
                onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Échéance *</Form.Label>
              <Form.Control
                type="date"
                name="due_date"
                value={taskForm.due_date}
                onChange={(e) => setTaskForm({...taskForm, due_date: e.target.value})}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Priorité</Form.Label>
              <Form.Select
                name="priority"
                value={taskForm.priority}
                onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
              >
                <option value="Haute">Haute</option>
                <option value="Normale">Normale</option>
                <option value="Basse">Basse</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Fichier</Form.Label>
              <Form.Control
                type="file"
                onChange={(e) => setTaskForm({...taskForm, file: e.target.files[0]})}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Envoyer une notification par email"
                name="notify"
                checked={taskForm.notify}
                onChange={(e) => setTaskForm({...taskForm, notify: e.target.checked})}
              />
            </Form.Group>
            
            <div className="d-flex justify-content-end">
              <Button variant="secondary" className="me-2" onClick={() => setShowTaskModal(false)}>
                Annuler
              </Button>
              <Button variant="success" type="submit" disabled={loading}>
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Modal d'assignation de tâche */}
      <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Assigner une Tâche</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAssignSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Document</Form.Label>
              <Form.Control 
                type="file" 
                onChange={(e) => setAssignForm({...assignForm, document: e.target.files[0]})} 
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Rechercher un utilisateur</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nom ou rôle"
                value={assignForm.searchUser}
                onChange={(e) => setAssignForm({...assignForm, searchUser: e.target.value})}
              />
              <div className="user-list mt-2">
                {filteredUsers.map(user => (
                  <div key={user.id} className="user-list-item d-flex justify-content-between">
                    <span>{user.username} ({user.role})</span>
                    <Button 
                      size="sm" 
                      variant="outline-primary"
                      onClick={() => handleUserSelect(user)}
                    >
                      Ajouter
                    </Button>
                  </div>
                ))}
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Utilisateurs assignés</Form.Label>
              <div>
                {assignForm.selectedUsers.map(user => (
                  <Badge 
                    key={user.id} 
                    pill 
                    bg="primary" 
                    className="me-2 mb-2" 
                    onClick={() => handleUserRemove(user.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    {user.username} ×
                  </Badge>
                ))}
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Instructions</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={assignForm.note}
                onChange={(e) => setAssignForm({...assignForm, note: e.target.value})}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Envoyer une notification"
                checked={assignForm.sendNotification}
                onChange={(e) => setAssignForm({...assignForm, sendNotification: e.target.checked})}
              />
            </Form.Group>

            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Assignement en cours...' : 'Assigner la tâche'}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Tableau des tâches */}
      <div className="table-responsive mt-4">
        <table className="table table-striped table-hover">
          <thead className="table-dark">
            <tr>
              <th>Titre</th>
              <th>Description</th>
              <th>Échéance</th>
              <th>Priorité</th>
              <th>Fichier</th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length > 0 ? (
              tasks.map(task => (
                <tr key={task.id}>
                  <td>{task.title}</td>
                  <td>{task.description || '-'}</td>
                  <td>{task.due_date ? new Date(task.due_date).toLocaleDateString('fr-FR') : '-'}</td>
                  <td>{task.priority}</td>
                  <td>
                    {task.file_path ? (
                      <a
                        href={`http://localhost:5000${task.file_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-primary"
                      >
                        Télécharger
                      </a>
                    ) : 'Aucun'}
                  </td>
                  <td>
                    {task.assigned_to ? 'Assignée' : 'Non assignée'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  Aucune tâche disponible
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Workflowss;
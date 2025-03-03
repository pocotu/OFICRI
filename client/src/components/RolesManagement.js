import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RolesManagement = () => {
    const [roles, setRoles] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        nombreRol: '',
        descripcion: '',
        nivelAcceso: 1,
        puedeCrear: false,
        puedeEditar: false,
        puedeDerivar: false,
        puedeAuditar: false
    });

    useEffect(() => {
        cargarRoles();
    }, []);

    const cargarRoles = async () => {
        try {
            const response = await axios.get('/api/roles');
            setRoles(response.data);
            setLoading(false);
        } catch (err) {
            setError('Error al cargar los roles');
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/roles', formData);
            cargarRoles();
            setFormData({
                nombreRol: '',
                descripcion: '',
                nivelAcceso: 1,
                puedeCrear: false,
                puedeEditar: false,
                puedeDerivar: false,
                puedeAuditar: false
            });
        } catch (err) {
            setError('Error al crear el rol');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('¿Está seguro de eliminar este rol?')) {
            try {
                await axios.delete(`/api/roles/${id}`);
                cargarRoles();
            } catch (err) {
                setError('Error al eliminar el rol');
            }
        }
    };

    if (loading) return <div>Cargando...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="roles-management">
            <h2>Gestión de Roles</h2>
            
            <form onSubmit={handleSubmit} className="role-form">
                <div className="form-group">
                    <label>Nombre del Rol:</label>
                    <input
                        type="text"
                        value={formData.nombreRol}
                        onChange={(e) => setFormData({...formData, nombreRol: e.target.value})}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Descripción:</label>
                    <textarea
                        value={formData.descripcion}
                        onChange={(e) => setFormData({...formData, descripcion: e.target.value})}
                    />
                </div>

                <div className="form-group">
                    <label>Nivel de Acceso:</label>
                    <input
                        type="number"
                        min="1"
                        value={formData.nivelAcceso}
                        onChange={(e) => setFormData({...formData, nivelAcceso: parseInt(e.target.value)})}
                        required
                    />
                </div>

                <div className="form-group permissions">
                    <label>
                        <input
                            type="checkbox"
                            checked={formData.puedeCrear}
                            onChange={(e) => setFormData({...formData, puedeCrear: e.target.checked})}
                        />
                        Puede Crear
                    </label>

                    <label>
                        <input
                            type="checkbox"
                            checked={formData.puedeEditar}
                            onChange={(e) => setFormData({...formData, puedeEditar: e.target.checked})}
                        />
                        Puede Editar
                    </label>

                    <label>
                        <input
                            type="checkbox"
                            checked={formData.puedeDerivar}
                            onChange={(e) => setFormData({...formData, puedeDerivar: e.target.checked})}
                        />
                        Puede Derivar
                    </label>

                    <label>
                        <input
                            type="checkbox"
                            checked={formData.puedeAuditar}
                            onChange={(e) => setFormData({...formData, puedeAuditar: e.target.checked})}
                        />
                        Puede Auditar
                    </label>
                </div>

                <button type="submit" className="btn-submit">Agregar Rol</button>
            </form>

            <div className="roles-list">
                <h3>Roles Existentes</h3>
                <table>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Descripción</th>
                            <th>Nivel de Acceso</th>
                            <th>Permisos</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roles.map(rol => (
                            <tr key={rol.IDRol}>
                                <td>{rol.NombreRol}</td>
                                <td>{rol.Descripcion}</td>
                                <td>{rol.NivelAcceso}</td>
                                <td>
                                    {rol.PuedeCrear && <span>Crear </span>}
                                    {rol.PuedeEditar && <span>Editar </span>}
                                    {rol.PuedeDerivar && <span>Derivar </span>}
                                    {rol.PuedeAuditar && <span>Auditar</span>}
                                </td>
                                <td>
                                    <button 
                                        onClick={() => handleDelete(rol.IDRol)}
                                        className="btn-delete"
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default RolesManagement;
import React, { useState, useEffect } from 'react';
import './Drones.css';
import Papa from 'papaparse';
import AddDronePopup from './AddDronePopup';
import EditDronePopup from './EditDronePopup';
import Topbar from './Topbar';
import AdminSidebar from './AdminSidebar';
import Swal from 'sweetalert2';
const Drones = () => {
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [dronesData, setDronesData] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [filter, setFilter] = useState('');
  const [selectedDrone, setSelectedDrone] = useState(null);

  useEffect(() => {
    fetchDrones();
  }, []);

  const fetchDrones = async () => {
    try {
      const response = await fetch('http://localhost:3003/drones');
      if (!response.ok) {
        throw new Error(`Failed to fetch drones: ${response.statusText}`);
        Swal.fire('Failed' ,`Failed to fetch drones: ${response.statusText}`, 'Failed');
      }
      const data = await response.json();
      setDronesData(data);
    } catch (error) {
      console.error(error.message);
      Swal.fire('Error' ,`Failed to fetch drones: ${error.message}`, 'Error');
    }
  };

  const addDrone = async (drone) => {
    try {
      const response = await fetch('http://localhost:3003/drones', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(drone)
      });
      if (!response.ok) {
        Swal.fire('Failed' ,`Failed to add drone:${response.statusText}`, 'Failed');
        throw new Error(`Failed to add drone: ${response.statusText}`);


      }
      fetchDrones(); // Refresh the drones list
    } catch (error) {
      Swal.fire('Error' ,`Failed to add drone: ${error.message}`, 'Error');
      console.error(error.message);
    }
  };

  const updateDrone = async (id, updatedDrone) => {
    try {
      const response = await fetch(`http://localhost:3003/drones/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatedDrone)
      });
      if (!response.ok) {
        Swal.fire('Failed' ,`Failed to update drone: ${response.statusText}`, 'Failed');
        throw new Error(`Failed to update drone: ${response.statusText}`);
      }
      fetchDrones(); // Refresh the drones list
    } catch (error) {
      console.error(error.message);
    }
  };

  const deleteDrone = async (imei) => {
    try {
      const response = await fetch(`http://localhost:3003/drones/delete/${imei}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        Swal.fire('Failed' ,`Failed to delete drone: ${response.statusText}`, 'Failed');
        throw new Error(`Failed to delete drone: ${response.statusText}`);
      }
      fetchDrones(); // Refresh the drones list
    } catch (error) {
      console.error(error.message);
    }
  };

  const sortedDrones = React.useMemo(() => {
    let sortableDrones = [...dronesData];
    if (sortConfig !== null) {
      sortableDrones.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableDrones;
  }, [dronesData, sortConfig]);

  const filteredDrones = sortedDrones.filter(drone =>
    drone.imei.includes(filter) ||
    drone.name.toLowerCase().includes(filter.toLowerCase()) ||
    drone.model.toLowerCase().includes(filter.toLowerCase()) ||
    drone.batteryId.toLowerCase().includes(filter.toLowerCase()) ||
    drone.soc.toString().includes(filter) ||
    drone.status.toLowerCase().includes(filter.toLowerCase())
  );

  const requestSort = key => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const toggleAddPopup = () => {
    setShowAddPopup(!showAddPopup);
  };

  const toggleEditPopup = (drone) => {
    setSelectedDrone(drone);
    setShowEditPopup(!showEditPopup);
  };

  const handleFileUpload = event => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: results => {
          const newDrones = results.data.map((row, index) => ({
            imei: row['IMEI'],
            name: row['Drone Name'],
            model: row['Model / ID'],
            batteryId: row['Battery ID'],
            soc: row['SOC % (Charge)'],
            status: row['Status'].toLowerCase(),
          }));
          newDrones.forEach(drone => addDrone(drone));
        },
      });
    }
  };

  const handleDelete = (imei) => {
    if (imei) {
      deleteDrone(imei);
    } else {
      console.error('Drone ID is undefined');
    }
  };

  const handleEdit = (drone) => {
    toggleEditPopup(drone);
  };

  return (
    <div className="admin-dashboard">
    <AdminSidebar />
    <div className="main-content">
      <Topbar />
    <div className="drones">
      <div className="drones-header">
        <h2>Manage Drones</h2>
        <div className="search-bar">
          <i className="fas fa-download"></i>
          <input type="text" placeholder="Search" value={filter} onChange={e => setFilter(e.target.value)} />
          <i className="fas fa-plus" onClick={toggleAddPopup}></i>
        </div>
      </div>
      <table className="drones-table">
        <thead>
          <tr>
            <th onClick={() => requestSort('imei')}>IMEI</th>
            <th onClick={() => requestSort('name')}>Drone Name</th>
            <th onClick={() => requestSort('model')}>Model / ID</th>
            <th onClick={() => requestSort('batteryId')}>Battery ID</th>
            <th onClick={() => requestSort('soc')}>SOC % (Charge)</th>
            <th onClick={() => requestSort('status')}>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredDrones.map((drone, index) => (
            <tr key={index}>
              <td>{drone.imei}</td>
              <td>{drone.name}</td>
              <td>{drone.model}</td>
              <td>{drone.batteryId}</td>
              <td>{drone.soc}</td>
              <td>{drone.status}</td>
              <td>
                <button onClick={() => handleEdit(drone)}>Edit</button>
                <button onClick={() => handleDelete(drone.imei)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <input type="file" accept=".csv" onChange={handleFileUpload} />
      {showAddPopup && <AddDronePopup onClose={toggleAddPopup} onSave={fetchDrones} />}
      {showEditPopup && selectedDrone && (
        <EditDronePopup onClose={toggleEditPopup} onSave={fetchDrones} drone={selectedDrone} />
      )}
    </div>
    </div>
</div>  );
};

export default Drones;

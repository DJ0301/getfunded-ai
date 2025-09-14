import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, XCircle, TrendingUp } from 'lucide-react';
import api from '../utils/api';
import './Pipeline.css';

// Install react-beautiful-dnd workaround for React 18
const StrictModeDroppable = ({ children, ...props }) => {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);
  if (!enabled) {
    return null;
  }
  return <Droppable {...props}>{children}</Droppable>;
};

function Pipeline({ founderData, investors }) {
  const [pipelineData, setPipelineData] = useState({
    contacted: [],
    replied: [],
    booked: [],
    not_interested: []
  });
  const [stats, setStats] = useState({});
  const [view, setView] = useState('kanban'); // 'kanban' or 'table'
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPipelineData();
  }, []);

  const fetchPipelineData = async () => {
    setLoading(true);
    try {
      const founderId = founderData?.founderEmail || 'default';
      const response = await api.get(`/pipeline/${founderId}`);
      
      // Organize investors by status
      const organized = {
        contacted: [],
        replied: [],
        booked: [],
        not_interested: []
      };

      // Map investors to pipeline stages
      if (investors && investors.length > 0) {
        investors.forEach(investor => {
          const pipelineInvestor = response.data.data.investors.find(
            inv => inv.email === investor.email || inv.investorId === investor.email
          );
          
          const status = pipelineInvestor?.status || 'contacted';
          const investorData = {
            ...investor,
            id: investor.email,
            status,
            lastUpdated: pipelineInvestor?.lastUpdated || new Date().toISOString()
          };

          if (organized[status]) {
            organized[status].push(investorData);
          }
        });
      }

      setPipelineData(organized);
      setStats(response.data.data.stats);
    } catch (error) {
      console.error('Error fetching pipeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    if (source.droppableId === destination.droppableId) {
      // Reordering within the same column
      const column = Array.from(pipelineData[source.droppableId]);
      const [removed] = column.splice(source.index, 1);
      column.splice(destination.index, 0, removed);
      
      setPipelineData({
        ...pipelineData,
        [source.droppableId]: column
      });
    } else {
      // Moving between columns
      const sourceColumn = Array.from(pipelineData[source.droppableId]);
      const destColumn = Array.from(pipelineData[destination.droppableId]);
      const [removed] = sourceColumn.splice(source.index, 1);
      
      // Update status
      removed.status = destination.droppableId;
      destColumn.splice(destination.index, 0, removed);
      
      setPipelineData({
        ...pipelineData,
        [source.droppableId]: sourceColumn,
        [destination.droppableId]: destColumn
      });

      // Update backend
      try {
        await api.put('/pipeline/update', {
          investorId: removed.id,
          status: destination.droppableId
        });
      } catch (error) {
        console.error('Error updating pipeline:', error);
      }
    }
  };

  const getColumnIcon = (columnId) => {
    switch (columnId) {
      case 'contacted':
        return <Mail size={20} />;
      case 'replied':
        return <User size={20} />;
      case 'booked':
        return <Calendar size={20} />;
      case 'not_interested':
        return <XCircle size={20} />;
      default:
        return null;
    }
  };

  const getColumnColor = (columnId) => {
    switch (columnId) {
      case 'contacted':
        return '#667eea';
      case 'replied':
        return '#10b981';
      case 'booked':
        return '#f59e0b';
      case 'not_interested':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Loading pipeline data...</p>
      </div>
    );
  }

  return (
    <div className="pipeline-container">
      <div className="pipeline-header">
        <h2 className="pipeline-title">Investor Pipeline</h2>
        <div className="view-toggle">
          <button 
            className={`view-btn ${view === 'kanban' ? 'active' : ''}`}
            onClick={() => setView('kanban')}
          >
            Kanban
          </button>
          <button 
            className={`view-btn ${view === 'table' ? 'active' : ''}`}
            onClick={() => setView('table')}
          >
            Table
          </button>
        </div>
      </div>

      <div className="pipeline-stats">
        <div className="stat-card">
          <TrendingUp size={20} />
          <div>
            <p className="stat-value">{stats.total || 0}</p>
            <p className="stat-label">Total Investors</p>
          </div>
        </div>
        <div className="stat-card">
          <Mail size={20} />
          <div>
            <p className="stat-value">{stats.contacted || 0}</p>
            <p className="stat-label">Contacted</p>
          </div>
        </div>
        <div className="stat-card">
          <User size={20} />
          <div>
            <p className="stat-value">{stats.replied || 0}</p>
            <p className="stat-label">Replied</p>
          </div>
        </div>
        <div className="stat-card">
          <Calendar size={20} />
          <div>
            <p className="stat-value">{stats.booked || 0}</p>
            <p className="stat-label">Meetings Booked</p>
          </div>
        </div>
      </div>

      {view === 'kanban' ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="kanban-board">
            {Object.entries(pipelineData).map(([columnId, items]) => (
              <div key={columnId} className="kanban-column">
                <div 
                  className="column-header"
                  style={{ borderColor: getColumnColor(columnId) }}
                >
                  {getColumnIcon(columnId)}
                  <h3>{columnId.replace('_', ' ').toUpperCase()}</h3>
                  <span className="column-count">{items.length}</span>
                </div>
                
                <StrictModeDroppable droppableId={columnId}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`column-content ${snapshot.isDraggingOver ? 'dragging-over' : ''}`}
                    >
                      {items.map((investor, index) => (
                        <Draggable
                          key={investor.id}
                          draggableId={investor.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`investor-card-pipeline ${snapshot.isDragging ? 'dragging' : ''}`}
                            >
                              <h4>{investor.name}</h4>
                              <p className="investor-firm-pipeline">{investor.firm}</p>
                              <p className="investor-email-pipeline">{investor.email}</p>
                              {investor.lastUpdated && (
                                <p className="last-updated">
                                  Updated: {new Date(investor.lastUpdated).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </StrictModeDroppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      ) : (
        <div className="table-view">
          <table className="pipeline-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Firm</th>
                <th>Email</th>
                <th>Status</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(pipelineData).flatMap(([status, items]) =>
                items.map(investor => (
                  <tr key={investor.id}>
                    <td>{investor.name}</td>
                    <td>{investor.firm}</td>
                    <td>{investor.email}</td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ background: getColumnColor(status) + '20', color: getColumnColor(status) }}
                      >
                        {status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>{new Date(investor.lastUpdated).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Pipeline;

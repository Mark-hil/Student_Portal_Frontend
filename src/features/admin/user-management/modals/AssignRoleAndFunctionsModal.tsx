import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck, Check, RotateCcw, Loader2, Sparkles,
  Layers, Users, Award, BookOpen, Building2,
  DollarSign, Key, CheckSquare, Square
} from 'lucide-react';
import { C } from '../../../../utils/theme';
import type { User, PortalRoleInfo, PortalFunction, Role } from '../../../../types';

interface AssignRoleAndFunctionsModalProps {
  target: User;
  roles: PortalRoleInfo[];
  functions: PortalFunction[];
  onClose: () => void;
  onConfirm: (data: { role: Role; assigned_functions: string[] }) => void;
  isPending: boolean;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Administration': <Users size={16} />,
  'Admissions & Registry': <Award size={16} />,
  'Academics & Curriculum': <BookOpen size={16} />,
  'Departmental Operations': <Building2 size={16} />,
  'Grading & Assessments': <Layers size={16} />,
  'Financial Management': <DollarSign size={16} />,
  'Security & System': <Key size={16} />,
};

export const AssignRoleAndFunctionsModal: React.FC<AssignRoleAndFunctionsModalProps> = ({
  target,
  roles,
  functions,
  onClose,
  onConfirm,
  isPending,
}) => {
  // Normalize target role to canonical or fallback
  const initialRole = (target.role || 'student') as Role;
  const [selectedRole, setSelectedRole] = useState<Role>(initialRole);
  
  // Selected functions set
  const [selectedFunctions, setSelectedFunctions] = useState<Set<string>>(() => {
    if (target.assigned_functions && target.assigned_functions.length > 0) {
      return new Set(target.assigned_functions);
    }
    // Fallback to role defaults from roles prop
    const roleDef = roles.find(r => r.code === initialRole);
    return new Set(roleDef?.default_functions || []);
  });

  // Group functions by category
  const categories = useMemo(() => {
    const grouped: Record<string, PortalFunction[]> = {};
    for (const fn of functions) {
      const cat = fn.category || 'General';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(fn);
    }
    return grouped;
  }, [functions]);

  const currentRoleInfo = useMemo(() => {
    return roles.find(r => r.code === selectedRole);
  }, [roles, selectedRole]);

  // When changing role, if user desires they can reset or see defaults
  const handleRoleChange = (newRole: Role) => {
    setSelectedRole(newRole);
    const newRoleInfo = roles.find(r => r.code === newRole);
    if (newRoleInfo) {
      // Auto-load defaults for the selected role
      setSelectedFunctions(new Set(newRoleInfo.default_functions));
    }
  };

  const handleResetToRoleDefaults = () => {
    if (currentRoleInfo) {
      setSelectedFunctions(new Set(currentRoleInfo.default_functions));
    }
  };

  const handleSelectAll = () => {
    setSelectedFunctions(new Set(functions.map(f => f.code)));
  };

  const handleClearAll = () => {
    setSelectedFunctions(new Set());
  };

  const toggleFunction = (code: string) => {
    setSelectedFunctions(prev => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const toggleCategory = (catFunctions: PortalFunction[]) => {
    const allChecked = catFunctions.every(f => selectedFunctions.has(f.code));
    setSelectedFunctions(prev => {
      const next = new Set(prev);
      for (const fn of catFunctions) {
        if (allChecked) {
          next.delete(fn.code);
        } else {
          next.add(fn.code);
        }
      }
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      role: selectedRole,
      assigned_functions: Array.from(selectedFunctions),
    });
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15,23,42,0.65)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 110,
      padding: 16,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 20,
        width: 860,
        maxWidth: '100%',
        maxHeight: '92vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        border: `1px solid ${C.slate2}`,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: `1px solid ${C.slate1}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#f8fafc',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#e0e7ff',
              color: C.indigo,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.slate9 }}>
                Assign Role & Functions
              </h2>
              <p style={{ margin: 0, fontSize: 12.5, color: C.slate5 }}>
                Configure institutional role and capability entitlements for <strong>{target.first_name} {target.last_name}</strong> ({target.email || target.student_id || 'Portal User'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: 22,
              cursor: 'pointer',
              color: C.slate4,
              padding: 4,
              lineHeight: 1,
            }}
          >
            &times;
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
            
            {/* Step 1: Institutional Role Selection */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.slate8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  1. Select Institutional Portal Role
                </span>
                <span style={{ fontSize: 12, color: C.indigo, fontWeight: 600 }}>
                  Current: {currentRoleInfo?.name || selectedRole}
                </span>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: 10,
              }}>
                {roles.map(role => {
                  const isSelected = selectedRole === role.code;
                  return (
                    <div
                      key={role.code}
                      onClick={() => handleRoleChange(role.code as Role)}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 12,
                        border: isSelected ? `2px solid ${C.indigo}` : `1px solid ${C.slate2}`,
                        background: isSelected ? '#f5f7ff' : '#fff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        position: 'relative',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{
                          fontSize: 13.5,
                          fontWeight: 700,
                          color: isSelected ? C.indigo : C.slate8,
                        }}>
                          {role.name}
                        </span>
                        {isSelected && (
                          <div style={{
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            background: C.indigo,
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <Check size={11} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <p style={{
                        margin: 0,
                        fontSize: 11.5,
                        color: C.slate5,
                        lineHeight: 1.35,
                      }}>
                        {role.description}
                      </p>
                      <div style={{ marginTop: 6, fontSize: 10.5, color: C.slate4 }}>
                        {role.default_functions.length} default functions
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Granular Capabilities & Functions */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 10,
                marginBottom: 12,
                borderTop: `1px solid ${C.slate1}`,
                paddingTop: 18,
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.slate8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    2. Configure Functions & Permissions
                  </div>
                  <div style={{ fontSize: 11.5, color: C.slate5 }}>
                    Fine-tune specific capabilities granted to this user beyond the default role template.
                  </div>
                </div>

                {/* Quick actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    onClick={handleResetToRoleDefaults}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 10px',
                      borderRadius: 8,
                      border: `1px solid ${C.indigoBorder}`,
                      background: C.indigoL,
                      color: C.indigo,
                      fontSize: 11.5,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    title="Revert to standard functions for this role"
                  >
                    <RotateCcw size={13} />
                    Reset to Role Defaults
                  </button>

                  <button
                    type="button"
                    onClick={handleSelectAll}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 8,
                      border: `1px solid ${C.slate2}`,
                      background: '#fff',
                      color: C.slate7,
                      fontSize: 11.5,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Select All
                  </button>

                  <button
                    type="button"
                    onClick={handleClearAll}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 8,
                      border: `1px solid ${C.slate2}`,
                      background: '#fff',
                      color: C.slate7,
                      fontSize: 11.5,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Function Categories */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {Object.entries(categories).map(([category, fns]) => {
                  const activeCount = fns.filter(f => selectedFunctions.has(f.code)).length;
                  const allActive = activeCount === fns.length;
                  const someActive = activeCount > 0 && !allActive;

                  return (
                    <div
                      key={category}
                      style={{
                        border: `1px solid ${C.slate2}`,
                        borderRadius: 12,
                        background: '#ffffff',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Category Header */}
                      <div
                        style={{
                          padding: '10px 14px',
                          background: '#f8fafc',
                          borderBottom: `1px solid ${C.slate1}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: C.indigo }}>{CATEGORY_ICONS[category] || <Layers size={16} />}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: C.slate8 }}>{category}</span>
                          <span style={{
                            fontSize: 11,
                            padding: '2px 8px',
                            borderRadius: 12,
                            background: activeCount > 0 ? '#e0e7ff' : C.slate1,
                            color: activeCount > 0 ? C.indigo : C.slate5,
                            fontWeight: 600,
                          }}>
                            {activeCount} / {fns.length} granted
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleCategory(fns)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: 11.5,
                            color: C.slate6,
                            fontWeight: 500,
                          }}
                        >
                          {allActive ? (
                            <>
                              <CheckSquare size={14} color={C.indigo} />
                              Deselect Category
                            </>
                          ) : (
                            <>
                              <Square size={14} color={someActive ? C.indigo : C.slate4} />
                              Select All in Category
                            </>
                          )}
                        </button>
                      </div>

                      {/* Category Items */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                        gap: 8,
                        padding: 12,
                      }}>
                        {fns.map(fn => {
                          const isChecked = selectedFunctions.has(fn.code);
                          const isDefault = currentRoleInfo?.default_functions.includes(fn.code);

                          return (
                            <label
                              key={fn.code}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 10,
                                padding: '8px 10px',
                                borderRadius: 8,
                                border: isChecked ? '1px solid #c7d2fe' : '1px solid #f1f5f9',
                                background: isChecked ? '#faf5ff' : '#fcfcfd',
                                cursor: 'pointer',
                                transition: 'background 0.15s ease',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleFunction(fn.code)}
                                style={{
                                  marginTop: 3,
                                  accentColor: C.indigo,
                                  cursor: 'pointer',
                                }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: 12.5, fontWeight: 700, color: C.slate8 }}>
                                    {fn.name}
                                  </span>
                                  {isDefault && (
                                    <span style={{
                                      fontSize: 10,
                                      padding: '1px 5px',
                                      borderRadius: 4,
                                      background: '#f1f5f9',
                                      color: C.slate6,
                                      fontWeight: 500,
                                    }}>
                                      Default
                                    </span>
                                  )}
                                  {isChecked && !isDefault && (
                                    <span style={{
                                      fontSize: 10,
                                      padding: '1px 5px',
                                      borderRadius: 4,
                                      background: '#ecfdf5',
                                      color: '#059669',
                                      fontWeight: 600,
                                    }}>
                                      + Custom
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: 11, color: C.slate5, lineHeight: 1.35, marginTop: 2 }}>
                                  {fn.description}
                                </div>
                                <code style={{ fontSize: 10, color: C.slate4, background: '#f1f5f9', padding: '1px 4px', borderRadius: 3 }}>
                                  {fn.code}
                                </code>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Footer Bar */}
          <div style={{
            padding: '16px 24px',
            background: '#f8fafc',
            borderTop: `1px solid ${C.slate2}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: C.slate5 }}>Enacted Role:</span>
              <span style={{
                fontSize: 12,
                fontWeight: 700,
                color: C.indigo,
                background: '#e0e7ff',
                padding: '3px 10px',
                borderRadius: 12,
              }}>
                {currentRoleInfo?.name || selectedRole}
              </span>
              <span style={{ fontSize: 12, color: C.slate4 }}>&bull;</span>
              <span style={{ fontSize: 12, color: C.slate6, fontWeight: 600 }}>
                {selectedFunctions.size} functions active
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                style={{
                  padding: '9px 18px',
                  borderRadius: 10,
                  border: `1px solid ${C.slate2}`,
                  background: '#fff',
                  color: C.slate7,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 20px',
                  borderRadius: 10,
                  border: 'none',
                  background: `linear-gradient(135deg, ${C.indigo} 0%, #3730a3 100%)`,
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: isPending ? 'not-allowed' : 'pointer',
                  boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
                }}
              >
                {isPending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Saving Permissions...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Apply Role & Functions
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

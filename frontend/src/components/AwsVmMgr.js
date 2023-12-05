import { useState, useEffect, useRef, useCallback } from "react";
import { AgGridReact } from "ag-grid-react";
import { Modal, Button } from "react-bootstrap";
import { VmDetail } from "./VmDetail";
import { NewVmForm } from "./NewVmForm";
import { ActionCellRenderer } from "./ActionCellRenderer";

import "./AwsVmMgr.css";
import "remixicon/fonts/remixicon.css";
import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-alpine.css";
import "ag-grid-community/dist/styles/ag-theme-alpine-dark.css";
import { initializeValueMaps } from "../data/config";

const AwsVmMgr = () => {
  const [vmDetailData, setVmDetailData] = useState();
  const [rowData, setRowData] = useState([]);
  const [columnDefs] = useState([
    {
      headerName: "Actions",
      pinned: "left",
      lockPinned: true,
      sortable: false,
      filter: false,
      cellRenderer: ActionCellRenderer,
    },
    {
      field: "state",
      pinned: "left",
      lockPinned: true,
      cellStyle: function (params) {
        if (params.value === "running") {
          return { backgroundColor: "var(--bs-success)" };
        }
      },
    },
    { field: "displayName" },
    { field: "instanceId" },
    {
      field: "os",
    },
    { field: "publicIpAddress" },
    { field: "publicDnsName" },
    { field: "instanceType" },
    {
      field: "accruedCost",
      cellRenderer: (params) => {
        const costStr = params.data.accruedCost.toLocaleString("en-US", { style: "currency", currency: "USD" });
        return <span>${costStr}</span>;
      },
    },
    {
      field: "launchTime",
      filter: "agDateColumnFilter",
      valueFormatter: function (params) {
        return params.value ? new Date(params.value).toLocaleString() : "";
      },
    },
    { field: "owner" },
    {
      field: "shutdownTime",
      valueFormatter: function (params) {
        const date = new Date();
        date.setUTCHours(params.value);
        date.setUTCMinutes(0);
        const localTimeString = date.toLocaleString("en-US", {
          timeZone: "America/New_York",
          timeZoneName: "short",
          hour12: true,
          hour: "2-digit",
          minute: "2-digit",
          formatTimezone: (abbreviation) => `(${abbreviation})`,
        });
        return localTimeString;
      },
    },
  ]);

  const rowDataRef = useRef();
  useEffect(() => {
    // initialize metadata
    initializeValueMaps();

    rowDataRef.current = rowData;
  }, [rowData]);

  const refreshGrid = useCallback((e) => {
    // declare the data fetching function
    const fetchData = async () => {
      const response = await fetch(`${process.env.REACT_APP_APIURL}/machines`);
      const data = await response.json();
      setRowData(data);
    };
    // call the async function
    fetchData().catch(console.error);
  }, []);

  // Load once and keep refreshing at an interval
  useEffect(() => {
    refreshGrid();
    const refreshInterval = setInterval(() => {
      refreshGrid();
    }, 10000); // Clean up the interval when the component unmounts
    return () => clearInterval(refreshInterval);
  }, [refreshGrid]);

  const openOrCloseDetailPane = (e) => {
    if (vmDetailData && vmDetailData !== "") {
      closeDetailPane(e);
    } else {
      setVmDetailData(e.data);
    }
  };

  const updateDetailPane = async (e) => {
    if (vmDetailData && vmDetailData !== "") {
      setVmDetailData(e.data);
    } else {
      closeDetailPane(e);
    }
  };

  const closeDetailPane = (e) => {
    setVmDetailData(null);
  };

  const gridColumnsChanged = (e) => {
    const savedState = e.columnApi.getColumnState();
    localStorage.setItem("test-history-columns", JSON.stringify(savedState));
  };

  const onGridReady = (e) => {
    e.columnApi.refreshGrid = () => {
      refreshGrid();
    };

    const stateStr = localStorage.getItem("test-history-columns");
    if (stateStr) {
      let savedState = JSON.parse(stateStr);
      e.columnApi.applyColumnState({ state: savedState });
    }
  };

  const [showModal, setShowModal] = useState(false);
  const handleShowModal = () => setShowModal(true);
  const handleCloseModal = () => setShowModal(false);

  return (
    <div className={"outer-div"}>
      <div className={"horiz-controls"}>
        <Button variant="primary" onClick={handleShowModal}>
          New VM
        </Button>
        <Button variant="ghost" onClick={refreshGrid} title="Close">
          <i className={"ri-refresh-line ri-xl"}></i>
        </Button>
      </div>
      <div className={"double-pane-box"}>
        <div className={"left-pane"}>
          <div className="ag-theme-alpine ag-grid-container card-style">
            <AgGridReact
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={{ filter: true, resizable: true, sortable: true }}
              onCellClicked={updateDetailPane}
              onCellDoubleClicked={openOrCloseDetailPane}
              onGridReady={onGridReady}
              onColumnResized={gridColumnsChanged}
              onColumnMoved={gridColumnsChanged}
              onColumnVisible={gridColumnsChanged}
              suppressDragLeaveHidesColumns={true}
              suppressCellFocus={true}
              rowSelection="single"
            ></AgGridReact>
          </div>
        </div>
        <div className={"right-pane " + (vmDetailData ? "shown" : "hidden")}>
          <div className="inner-right-pane card-style">
            <header className="detail-header">
              <label>Machine Detail</label>
              <span style={{ display: "flex" }}>
                <button className={"header-button"} onClick={closeDetailPane} title="Close">
                  <i className={"ri-close-line ri-xl"}></i>
                </button>
              </span>
            </header>
            <VmDetail details={vmDetailData}></VmDetail>
          </div>
        </div>
      </div>
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Create New VM</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <NewVmForm
            onClose={() => {
              handleCloseModal();
              refreshGrid();
            }}
          />
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default AwsVmMgr;

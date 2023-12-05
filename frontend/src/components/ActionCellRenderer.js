import React from "react";
import styled from "styled-components";

const StartButton = styled.button`
  height: 30px;
  width: 30px;
  margin: -4px 4px 0 0;
  padding: 6px 0 0 0;
  border: none;
`;

export const ActionCellRenderer = (props) => {
  const startInstance = async () => {
    await performAction("start");
  };

  const stopInstance = async () => {
    await performAction("stop");
  };

  const terminateInstance = async () => {
    const confirmDelete = window.confirm("Are you sure you want to terminate this instance?");
    if (confirmDelete) {
      await performAction("terminate");
    }
  };

  const performAction = async (action) => {
    let body = { command: action, instanceId: props.data.instanceId };

    const response = await fetch(`${process.env.REACT_APP_APIURL}/machines/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await response.json();

    // after performing some action, wait a second and refresh
    setTimeout(() => {
      console.log(props);
      props.columnApi.refreshGrid();
    }, 1000);
  };

  return (
    <>
      <StartButton
        title="Start"
        onClick={startInstance}
        className={props.data?.state !== "stopped" ? "btn btn-outline-secondary" : "btn btn-outline-success"}
        disabled={props.data?.state !== "stopped"}
      >
        <i className={"ri-play-line ri-xl"}></i>
      </StartButton>
      <StartButton
        title="Stop"
        onClick={stopInstance}
        className={props.data?.state !== "running" ? "btn btn-outline-secondary" : "btn btn-outline-danger"}
        disabled={props.data?.state !== "running"}
      >
        <i className={"ri-stop-line ri-xl"}></i>
      </StartButton>
      <StartButton title="Terminate" onClick={terminateInstance} className={"btn btn-outline-dark"}>
        <i className={"ri-delete-bin-7-line ri-xl"}></i>
      </StartButton>
    </>
  );
};

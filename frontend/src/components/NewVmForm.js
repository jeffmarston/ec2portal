import React, { useState } from "react";
import { Form, Button } from "react-bootstrap";
import { valueMap } from "../data/config.js";

export const NewVmForm = (props) => {
  const [formValues, setFormValues] = useState({
    name: "dev-",
    instanceType: "t2.micro",
    ami: "",
    shutdownTime: "2",
  });

  const createNewMachine = async (formValues) => {
    let requestData = { ...formValues };

    const response = await fetch(`${process.env.REACT_APP_APIURL}/machines`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    });
    await response.json();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "name" && !value.startsWith("dev-")) {
      return;
    }
    setFormValues({ ...formValues, [name]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formValues.ami === "") {
      alert("no good ami");
    } else {
      createNewMachine(formValues);
      props.onClose();
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group>
        <Form.Label>Name</Form.Label>
        <Form.Control type="text" name="name" value={formValues.name} onChange={handleChange} />
      </Form.Group>
      <Form.Group>
        <Form.Label>Instance Type</Form.Label>
        <Form.Control as="select" name="instanceType" value={formValues.instanceType} onChange={handleChange}>
          {valueMap.instanceTypes.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </Form.Control>
      </Form.Group>
      <Form.Group>
        <Form.Label>Image</Form.Label>
        <Form.Control as="select" name="ami" value={formValues.ami} onChange={handleChange}>
          {valueMap.images.map((option) => (
            <option key={option.imageId} value={option.imageId}>
              {option.name}
            </option>
          ))}
        </Form.Control>
      </Form.Group>
      <Form.Group>
        <Form.Label>Auto Shutdown</Form.Label>
        <Form.Control as="select" name="shutdownTime" value={formValues.shutdownTime} onChange={handleChange}>
          {valueMap.autoShutdownHours.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Form.Control>
      </Form.Group>
      <Button variant="primary" type="submit" style={{ float: "right", marginTop: "6px" }}>
        Create
      </Button>
    </Form>
  );
};

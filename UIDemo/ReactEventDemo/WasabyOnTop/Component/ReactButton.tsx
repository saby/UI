function ReactButton(props) {
    return (
        <button className="Button" onClick={props.buttonHandler}>
            {props.buttonText}
        </button>
    );
}

export default ReactButton;

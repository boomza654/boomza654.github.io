import "./FileInput.scss"
import React from 'react'

type FileInputConfig = {
    // accept? : string;
    isLoading : boolean;
    onChange? : React.ChangeEventHandler<HTMLInputElement>;
};

export default function FileInput( config : FileInputConfig ) {
    const fileinput_id = React.useId();
    return (
        
        <label htmlFor={fileinput_id}>
        <div className="file-input-container">
            <div className="file-input-container2">
                <input className="file-input-input" 
                    id={fileinput_id}
                    type="file"
                    disabled={config.isLoading}
                    // accept={config.accept}
                    onChange={config.onChange}
                /> 
            </div>
        </div>
        </label>
        
    );
}


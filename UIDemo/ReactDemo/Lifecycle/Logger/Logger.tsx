import {Component} from 'react';
import LoggerService, {ILog} from './LoggerService';
import 'css!UIDemo/ReactDemo/Lifecycle/Logger/Logger'

export default class Logger extends Component<object, { logs: ILog[] }> {
    private logger = LoggerService.getInstance();

    constructor(props) {
        super(props);
        this.state = {
            logs: this.logger.get()
        };
    }

    componentDidMount() {
        this.logger.subscribe((newLogs) => {
            this.setState({
                logs: newLogs
            });
        });
    }

    render() {
        return (
            <div className="logger">
                {this.state.logs.map((log) =>
                    <div key={log.date.getTime() + log.title}>
                        <span>{log.date.toLocaleTimeString()}</span>
                        {log.title}
                    </div>
                )}
            </div>
        );
    }
}

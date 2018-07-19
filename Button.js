import React,{ Component }  from 'react';
import {StyleSheet, Text, View, TouchableOpacity} from 'react-native';

export default class Button extends Component {
    constructor(props) {
        super(props);
        this.props = props;
    }

    render() {
        return (
            <View>
                <TouchableOpacity
                    // style={[styles.button, {}]}
                    style={styles.button}
                    onPress={this.props.callback}
                >
                    <Text style={styles.text}> {this.props.text || ''} </Text>
                </TouchableOpacity>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    button: {
    
        backgroundColor: 'lightblue',
        padding: 4,
        borderRadius: 50/2
    },
    text:{
        alignItems:'center',
        fontSize:25
    }
});

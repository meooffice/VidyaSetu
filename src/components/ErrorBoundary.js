import { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.log('Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.icon}>😕</Text>
          <Text style={styles.title}>ఏదో తప్పు జరిగింది!</Text>
          <Text style={styles.message}>
            App లో error వచ్చింది. మళ్ళీ try చేయండి!
          </Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => this.setState({ hasError: false, error: null })}>
            <Text style={styles.btnText}>🔄 మళ్ళీ try చేయి</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a73e8',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  icon: { fontSize: 70, marginBottom: 20 },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'SreeKrushnadevaraya',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    color: '#e8f0fe',
    textAlign: 'center',
    fontFamily: 'SreeKrushnadevaraya',
    marginBottom: 30,
  },
  btn: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
  },
  btnText: {
    color: '#1a73e8',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'SreeKrushnadevaraya',
  },
});
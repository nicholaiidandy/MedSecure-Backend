pipeline {
agent any

```
tools {
    nodejs 'nodejs-20'
}

environment {
    PATH = "/usr/local/bin:/usr/bin:/bin:/opt/zaproxy:${env.PATH}"
}

stages {

    stage('Clone Repository') {
        steps {
            git branch: 'master',
            url: 'https://github.com/nicholaiidandy/MedSecure-Backend.git'
        }
    }

    stage('Workspace Info') {
        steps {
            sh '''
            echo "===== WORKSPACE ====="
            pwd
            ls -la

            echo "===== NODE VERSION ====="
            node -v
            npm -v
            '''
        }
    }

    stage('Install Dependencies') {
        steps {
            sh '''
            echo "===== INSTALL DEPENDENCIES ====="

            npm install
            '''
        }
    }

    stage('Dependency Audit') {
        steps {
            sh '''
            echo "===== NPM AUDIT ====="

            npm audit --audit-level=high || true
            '''
        }
    }

    stage('Build Project') {
        steps {
            sh '''
            echo "===== BUILD PROJECT ====="

            npm run build
            '''
        }
    }

    stage('SAST - Semgrep') {
        steps {
            sh '''
            echo "===== SEMGREP SAST ====="

            semgrep --config=auto . || true
            '''
        }
    }

    stage('Run Backend') {
        steps {
            sh '''
            echo "===== RUN BACKEND ====="

            npm install -g pm2

            pm2 delete medsecure-backend || true

            pm2 start dist/index.js --name medsecure-backend

            sleep 15

            echo "===== PM2 STATUS ====="
            pm2 status

            echo "===== PM2 LOGS ====="
            pm2 logs medsecure-backend --lines 50 --nostream || true
            '''
        }
    }

    stage('Health Check') {
        steps {
            sh '''
            echo "===== HEALTH CHECK ====="

            curl -v http://127.0.0.1:3000 || true
            '''
        }
    }

    stage('DAST - OWASP ZAP') {
        steps {
            sh '''
            echo "===== OWASP ZAP DAST ====="

            pkill -f zap || true

            sleep 5

            /opt/zaproxy/zap.sh \
              -daemon \
              -host 0.0.0.0 \
              -port 8090 \
              -config api.disablekey=true

            sleep 20

            /opt/zaproxy/zap.sh \
              -cmd \
              -quickurl http://127.0.0.1:3000 \
              -quickprogress \
              -port 8090 || true
            '''
        }
    }

    stage('PM2 Status') {
        steps {
            sh '''
            echo "===== FINAL PM2 STATUS ====="

            pm2 status

            echo "===== FINAL PM2 LOGS ====="

            pm2 logs medsecure-backend --lines 100 --nostream || true
            '''
        }
    }
}

post {
    always {
        archiveArtifacts artifacts: '**/*.log', allowEmptyArchive: true

        sh '''
        echo "===== CLEANUP ====="

        pm2 save || true
        '''
    }

    success {
        echo 'Pipeline Success!'
    }

    failure {
        echo 'Pipeline Failed!'
    }
}
```

}

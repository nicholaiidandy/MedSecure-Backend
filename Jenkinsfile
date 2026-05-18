pipeline {
    agent any

    tools {
        nodejs "nodejs-20"
    }

    environment {
        APP_NAME = "medsecure-backend"
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

                    pm2 delete ${APP_NAME} || true

                    pm2 start npm --name ${APP_NAME} -- start

                    sleep 15

                    echo "===== PM2 STATUS ====="
                    pm2 status

                    echo "===== PM2 LOGS ====="
                    pm2 logs ${APP_NAME} --lines 50 --nostream || true
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                    echo "===== HEALTH CHECK ====="

                    curl -I http://localhost:3000 || true

                    echo "===== PORT CHECK ====="
                    netstat -tulpn | grep 3000 || true
                '''
            }
        }

        stage('DAST - OWASP ZAP') {
            steps {
                sh '''
                    echo "===== OWASP ZAP DAST ====="

                    /opt/zaproxy/zap.sh \
                    -cmd \
                    -port 8090 \
                    -quickurl http://localhost:3000 \
                    -quickprogress || true
                '''
            }
        }

        stage('PM2 Status') {
            steps {
                sh '''
                    echo "===== FINAL PM2 STATUS ====="

                    pm2 list
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
}
